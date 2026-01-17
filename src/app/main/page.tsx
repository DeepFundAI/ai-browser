"use client";

import { usePathname, useSearchParams } from 'next/navigation';
import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import { Button, App } from 'antd'
import { CaretRightOutlined, PauseOutlined } from '@ant-design/icons'
import { MessageList } from '@/components/chat/message';
import { MessageProcessor } from '@/utils/messageTransform';
import { useTaskManager } from '@/hooks/useTaskManager';
import { useHistoryStore } from '@/stores/historyStore';
import { useTranslation } from 'react-i18next';
import { FileAttachmentList } from '@/components/chat/FileAttachmentList';
import { useTaskPlayback } from '@/hooks/useTaskPlayback';
import { useScroll } from '@/hooks/useScroll';
import { useToolHistory } from '@/hooks/useToolHistory';
import { useTaskHandlers } from '@/hooks/useTaskHandlers';
import { useMessageHandlers } from '@/hooks/useMessageHandlers';
import { useInteractionHandlers } from '@/hooks/useInteractionHandlers';
import { useTaskExecution } from '@/hooks/useTaskExecution';
import { useEventListeners } from '@/hooks/useEventListeners';
import { ChatInputArea } from '@/components/chat/ChatInputArea';
import { HistoryModeHeader } from '@/components/chat/HistoryModeHeader';
import { DetailPanel } from '@/components/chat/DetailPanel';
import { PlaybackSpeedControl } from '@/components/chat/PlaybackSpeedControl';
import { useHasValidProvider } from '@/hooks/useHasValidProvider';


export default function main() {
    const { t } = useTranslation('main');
    const hasValidProvider = useHasValidProvider();
    const { message: antdMessage } = App.useApp();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const urlTaskId = searchParams.get('taskId');
    const urlExecutionId = searchParams.get('executionId');

    // Check if in task detail mode (opened from scheduled task window)
    const isTaskDetailMode = !!urlTaskId && !!urlExecutionId;

    // Scheduled task's scheduledTaskId (from URL)
    const scheduledTaskIdFromUrl = typeof urlTaskId === 'string' ? urlTaskId : undefined;

    // Use task management Hook
    const {
        tasks,
        currentTask,
        currentTaskId,
        isHistoryMode,
        setCurrentTaskId,
        updateTask,
        createTask,
        updateMessages,
        addToolHistory,
        replaceTaskId,
        enterHistoryMode,
        exitHistoryMode,
    } = useTaskManager();

    // Use Zustand history state management
    const { selectedHistoryTask, clearSelectedHistoryTask, setTerminateCurrentTaskFn } = useHistoryStore();

    // History playback control (only active in history mode)
    // Use task playback for data-driven streaming
    const playback = useTaskPlayback({
        sourceTask: currentTask || {
            id: '',
            name: '',
            messages: [],
            status: 'done',
            createdAt: new Date(),
            updatedAt: new Date(),
            taskType: 'normal'
        },
        autoPlay: false,
        defaultSpeed: 1,
    });

    // In history mode: determine which task to display
    // - If playing: show playbackTask (dynamically growing)
    // - If idle/paused: show original currentTask
    // In normal mode: always show currentTask
    const displayTask = isHistoryMode && playback.status === 'playing' && playback.playbackTask
        ? playback.playbackTask
        : currentTask;

    const displayMessages = displayTask?.messages || [];

    // Use tool history management hook
    const {
        toolHistory,
        setToolHistory,
        currentHistoryIndex,
        setCurrentHistoryIndex,
        showDetail,
        setShowDetail,
        isViewingAttachment,
        setIsViewingAttachment,
        switchToHistoryIndex
    } = useToolHistory({
        isHistoryMode,
        playbackStatus: playback.status,
        displayMessages
    });

    // Use scroll management hook
    const { scrollContainerRef, handleScroll } = useScroll({
        displayMessages,
        isHistoryMode,
        playbackStatus: playback.status,
        toolHistory
    });

    // Other local state
    const [query, setQuery] = useState('');
    const [currentUrl, setCurrentUrl] = useState<string>('');
    const [currentTool, setCurrentTool] = useState<{
        toolName: string;
        operation: string;
        status: 'running' | 'completed' | 'error';
    } | null>(null);

    // Check if current task is running
    const isCurrentTaskRunning = useMemo(() => {
        if (!currentTaskId || isHistoryMode) return false;
        const currentTask = tasks.find(task => task.id === currentTaskId);
        return currentTask?.status === 'running';
    }, [currentTaskId, isHistoryMode, tasks]);

    // Refs
    const taskIdRef = useRef<string>(currentTaskId);
    const messageProcessorRef = useRef(new MessageProcessor());
    const executionIdRef = useRef<string>('');
    const lastUserMessageRef = useRef<string>('');

    const showDetailAgents = ['Browser', 'File'];

    // Use task handlers hook
    const {
        terminateCurrentTask,
        handleSelectHistoryTask,
        handleContinueConversation: handleContinueConversationBase,
    } = useTaskHandlers({
        currentTaskId,
        taskIdRef,
        executionIdRef,
        updateTask,
        replaceTaskId,
        enterHistoryMode,
        exitHistoryMode,
        setToolHistory,
        setCurrentUrl,
    });

    // Use message handlers hook
    const {
        onMessage,
        getToolOperation,
        getToolStatus,
    } = useMessageHandlers({
        isHistoryMode,
        isTaskDetailMode,
        scheduledTaskId: scheduledTaskIdFromUrl,
        taskIdRef,
        messageProcessorRef,
        currentTaskId,
        tasks,
        showDetailAgents,
        toolHistory,
        updateTask,
        createTask,
        replaceTaskId,
        setCurrentTaskId,
        setCurrentTool,
        setShowDetail,
        setToolHistory,
        addToolHistory,
    });

    // Use interaction handlers hook
    const {
        handleToolClick,
        handleHumanResponse,
        handleFileClick,
    } = useInteractionHandlers({
        toolHistory,
        showDetail,
        setShowDetail,
        setCurrentHistoryIndex,
        setCurrentTool,
        setCurrentUrl,
        setIsViewingAttachment,
        switchToHistoryIndex,
        getToolOperation,
        getToolStatus,
    });

    // Use task execution hook
    const { sendMessage } = useTaskExecution({
        isHistoryMode,
        isTaskDetailMode,
        scheduledTaskIdFromUrl,
        taskIdRef,
        executionIdRef,
        messageProcessorRef,
        createTask,
        updateTask,
        updateMessages,
        setCurrentTaskId,
    });

    // Use event listeners hook
    useEventListeners({
        isTaskDetailMode,
        scheduledTaskIdFromUrl,
        tasks,
        taskIdRef,
        showDetail,
        isViewingAttachment,
        isHistoryMode,
        updateTask,
        onStreamMessage: onMessage,
        setCurrentUrl,
    });

    // Wrapper for continue conversation with UI state updates
    const handleContinueConversation = useCallback(async () => {
        if (!currentTask) {
            antdMessage.error(t('no_task_to_continue'));
            return;
        }

        // Stop playback before continuing conversation
        playback.stop();

        // Check if task has workflow
        if (!currentTask.workflow) {
            antdMessage.error(t('task_missing_context'));
            console.error('Task missing workflow:', currentTask);
            return;
        }

        // Restore task context
        const result = await (window.api as any).ekoRestoreTask(
            currentTask.workflow,
            currentTask.contextParams || {},
            currentTask.chainPlanRequest,
            currentTask.chainPlanResult
        );

        if (!result?.success) {
            antdMessage.error(t('continue_conversation_failed'));
            return;
        }

        // Call base handler (exits history mode, generates execution ID)
        await handleContinueConversationBase(currentTask);

        // Update UI states
        setIsViewingAttachment(false);
        setCurrentTaskId(currentTask.id);
        taskIdRef.current = currentTask.id;

        // Reset detail panel: hide playback screenshot
        setCurrentHistoryIndex(-1);
        await (window.api as any).hideHistoryView?.();

        // Restore lastUrl and navigate detail view to initial address
        setShowDetail(false);
        await (window.api as any).setDetailViewVisible?.(false);

        // Restore tool history
        setToolHistory(currentTask.toolHistory || []);

        // Restore historical messages to MessageProcessor
        if (currentTask.messages && currentTask.messages.length > 0) {
            messageProcessorRef.current.setMessages(currentTask.messages);
        }

        antdMessage.success(t('conversation_continued'));
    }, [currentTask, playback, handleContinueConversationBase, antdMessage, t, setIsViewingAttachment,
        setCurrentTaskId, taskIdRef, setCurrentUrl, setShowDetail, setToolHistory, setCurrentHistoryIndex, messageProcessorRef]);

    // Handle retry - resend last user message
    const handleRetry = useCallback(async () => {
        const lastMessage = lastUserMessageRef.current;
        if (!lastMessage) {
            antdMessage.warning(t('no_message_to_retry'));
            return;
        }

        // Resend the last user message
        await sendMessage(lastMessage);
    }, [sendMessage, antdMessage, t]);

    // Synchronize taskIdRef
    useEffect(() => {
        taskIdRef.current = currentTaskId;
    }, [currentTaskId]);


    // Register termination function in store for use by other components
    useEffect(() => {
        setTerminateCurrentTaskFn(terminateCurrentTask);
    }, [terminateCurrentTask]);

    // Handle implicit message passing from home page
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const pendingMessage = sessionStorage.getItem('pendingMessage');
            if (pendingMessage) {
                console.log('Detected pending message:', pendingMessage);
                // Clear message to avoid duplicate sending
                sessionStorage.removeItem('pendingMessage');
                // Automatically send message
                setTimeout(() => {
                    sendMessage(pendingMessage);
                }, 100);
            }
        }
    }, [sendMessage]);

    // Monitor history task selection from Zustand store
    useEffect(() => {
        if (selectedHistoryTask) {
            handleSelectHistoryTask(selectedHistoryTask, isCurrentTaskRunning);
            // Reset detail panel when switching history task
            setShowDetail(false);
            setCurrentHistoryIndex(-1);
            setIsViewingAttachment(false);
            // Clear selection after processing
            clearSelectedHistoryTask();
        }
    }, [selectedHistoryTask, handleSelectHistoryTask, isCurrentTaskRunning, clearSelectedHistoryTask, setShowDetail, setCurrentHistoryIndex, setIsViewingAttachment]);

    // Task termination handling (manual click cancel button)
    const handleCancelTask = async () => {
        if (!currentTaskId) {
            antdMessage.error(t('no_task_running'));
            return;
        }

        const success = await terminateCurrentTask();
        if (success) {
            antdMessage.success(t('task_terminated'));
        } else {
            antdMessage.error(t('terminate_failed'));
        }
    };

    return (
        <div className="h-full flex flex-col">
            <Header />
            <div className='bg-main-view dark:bg-main-view-dark bg-origin-padding bg-no-repeat bg-cover flex-1 text-text-01 dark:text-text-01-dark flex overflow-hidden'>
                <div className='flex-1 h-full transition-all duration-300 flex flex-col'>
                    <div className='w-[636px] mx-auto flex flex-col gap-2 pt-7 pb-4 flex-1 relative min-h-0'>
                        {/* Task title and history button */}
                        {isHistoryMode ? (
                            <HistoryModeHeader
                                taskName={currentTask?.name}
                                onContinue={handleContinueConversation}
                            />
                        ) : (
                            <div className='absolute top-0 left-0 w-full flex items-center justify-between'>
                                <div className='line-clamp-1 text-xl font-semibold flex-1'>
                                    {currentTaskId && tasks.find(task => task.id === currentTaskId)?.name}
                                </div>
                            </div>
                        )}
                        {/* Message list */}
                        <div
                            ref={scrollContainerRef}
                            className='flex-1 min-h-0 overflow-x-hidden overflow-y-auto px-4 pt-5'
                            onScroll={handleScroll}
                        >
                            {/* Always use MessageList, displayMessages grows dynamically during playback */}
                            <MessageList
                                messages={displayMessages}
                                onToolClick={handleToolClick}
                                onHumanResponse={handleHumanResponse}
                                onFileClick={handleFileClick}
                                onRetry={handleRetry}
                            />
                        </div>

                        {/* File attachments list - fixed position above input */}
                        {currentTask && currentTask.files && currentTask.files.length > 0 && (
                            <div className='px-4'>
                                <FileAttachmentList
                                    files={currentTask.files}
                                    onFileClick={handleFileClick}
                                />
                            </div>
                        )}

                        {/* Question input box / Playback control */}
                        {isHistoryMode ? (
                            /* History mode: Show replay button with speed control */
                            <div className='h-30 gradient-border relative'>
                                <div className="h-full flex items-center justify-center gap-4 bg-tool-call dark:bg-tool-call-dark rounded-xl">
                                    <Button
                                        type="primary"
                                        size="large"
                                        icon={playback.status === 'playing' ? <PauseOutlined /> : <CaretRightOutlined />}
                                        onClick={() => {
                                            if (playback.status === 'playing') {
                                                playback.stop();
                                            } else {
                                                playback.restart();
                                            }
                                        }}
                                        className="bg-[linear-gradient(135deg,#5E31D8,#8B5CF6)] border-transparent px-6"
                                    >
                                        {playback.status === 'playing'
                                            ? t('stop_replay') || '终止回放'
                                            : t('replay') || '开始回放'}
                                    </Button>
                                    <PlaybackSpeedControl
                                        speed={playback.speed}
                                        onSpeedChange={playback.setSpeed}
                                    />
                                    {playback.status === 'playing' && (
                                        <span className="text-sm text-gray-400">
                                            {playback.progress}%
                                        </span>
                                    )}
                                </div>
                            </div>
                        ) : (
                            /* Normal mode: Show input box */
                            <ChatInputArea
                                query={query}
                                isCurrentTaskRunning={isCurrentTaskRunning}
                                hasValidProvider={hasValidProvider}
                                onQueryChange={setQuery}
                                onSend={async () => {
                                    const messageToSend = query.trim();
                                    if (!messageToSend) return;

                                    // Save last user message for retry
                                    lastUserMessageRef.current = messageToSend;

                                    // Clear input immediately for better UX
                                    setQuery('');

                                    // Send message (async)
                                    await sendMessage(messageToSend);
                                }}
                                onCancel={handleCancelTask}
                            />
                        )}
                    </div>

                </div>
                <DetailPanel
                    showDetail={showDetail}
                    currentUrl={currentUrl}
                    currentTool={currentTool}
                    toolHistory={toolHistory}
                    currentHistoryIndex={currentHistoryIndex}
                    onHistoryIndexChange={switchToHistoryIndex}
                />
            </div>
        </div>
    )
}
