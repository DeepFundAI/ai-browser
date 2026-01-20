"use client";

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import { Input, Button, App } from 'antd'
import { AudioOutlined, AudioMutedOutlined } from '@ant-design/icons'
import { SendMessage } from '@/icons/deepfundai-icons'
import { ScheduledTaskModal, ScheduledTaskListPanel } from '@/components/scheduled-task'
import { useScheduledTaskStore } from '@/stores/scheduled-task-store'
import { ModelSelector } from '@/components/ModelSelector'
import { ChromeBrowserBackground } from '@/components/fellou/ChromeBrowserBackground'
import { useTranslation } from 'react-i18next'
import { useVoiceInput } from '@/hooks/useVoiceInput'
import { useHasValidProvider } from '@/hooks/useHasValidProvider'

export default function Home() {
    const [query, setQuery] = useState('')
    const router = useRouter()
    const { t } = useTranslation('home')
    const { message: antdMessage } = App.useApp()
    const hasValidProvider = useHasValidProvider()

    // Voice input hook
    const { isRecording, toggleRecording } = useVoiceInput({
        onTextRecognized: (text) => {
            // Append recognized text to input
            setQuery(prev => prev ? `${prev} ${text}` : text);
        },
        onError: (error) => {
            antdMessage.error(t('voice_input_error'));
            console.error('Voice input error:', error);
        },
    })

    // Initialize scheduled task scheduler
    // Note: Use main process state flag to prevent duplicate initialization due to route switching
    useEffect(() => {
        const initScheduler = async () => {
            if (typeof window !== 'undefined' && (window as any).api) {
                const response = await (window as any).api.invoke('scheduler:is-initialized')

                if (response?.success && response.data?.isInitialized) {
                    return
                }

                // Load and register all enabled tasks from storage
                const { initializeScheduler } = useScheduledTaskStore.getState()
                await initializeScheduler()

                // Mark main process as initialized
                await (window as any).api.invoke('scheduler:mark-initialized')
            }
        }

        initScheduler()
    }, [])

    // Handle sending message
    const handleSendMessage = useCallback(() => {
        if (!hasValidProvider) {
            antdMessage.warning(t('no_provider_warning') || 'Please configure AI provider in Settings first');
            return;
        }

        if (query.trim()) {
            // Use sessionStorage to implicitly pass message
            if (typeof window !== 'undefined') {
                sessionStorage.setItem('pendingMessage', query.trim())
            }
            // Directly navigate to main page without URL parameters
            router.push('/main')
        }
    }, [hasValidProvider, query, router, antdMessage, t])

    // Handle Enter key
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSendMessage()
        }
    }

    return (
        <div className="h-full flex flex-col">
            <ChromeBrowserBackground/>
            <Header />
            <div className='bg-main-view dark:bg-main-view-dark bg-origin-padding bg-no-repeat bg-cover flex-1 text-text-01 dark:text-text-01-dark flex flex-col overflow-hidden'>
                <div className='flex flex-col items-center pt-[130px] w-full flex-1 overflow-y-auto z-10'>
                    {/* Greeting */}
                    <div className='text-left leading-10 text-text-01 dark:text-text-01-dark text-[28px] font-bold'>
                        <div>{t('greeting_name')}</div>
                        <p>{t('greeting_intro')}</p>
                    </div>

                    {/* Unified Input Area: Query Input with Model Selector */}
                    <div className='gradient-border w-[740px] mt-[30px]' style={{ height: 'auto' }}>
                        <div className='bg-tool-call dark:bg-tool-call-dark rounded-xl w-full h-full p-4'>
                            <div className='relative h-[160px] border border-solid border-gray-300 dark:border-white/20 rounded'>
                                <Input.TextArea
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    className='!h-full !bg-transparent !text-text-01 dark:!text-text-01-dark !placeholder-text-12 dark:!placeholder-text-12-dark !py-3 !px-4 !pb-12 !pr-20 !border-none !outline-none focus:!shadow-none'
                                    placeholder={t('input_placeholder')}
                                    autoSize={false}
                                />
                                {/* Model Selector at bottom-left */}
                                <div className='absolute bottom-3 left-3'>
                                    <ModelSelector />
                                </div>
                                {/* Action buttons at bottom-right */}
                                <div className='absolute bottom-3 right-3 flex items-center gap-2'>
                                    {/* Voice input button */}
                                    <Button
                                        type='text'
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            toggleRecording();
                                        }}
                                        className={`!p-0 !w-9 !h-9 !min-w-0 flex items-center justify-center text-lg cursor-pointer rounded-lg transition-all duration-200
                                            ${isRecording
                                                ? '!bg-red-500/20 !text-red-500 hover:!bg-red-500/30'
                                                : 'hover:!bg-gray-100 dark:hover:!bg-white/10 !text-gray-500 dark:!text-gray-400 hover:!text-primary dark:hover:!text-purple-400'
                                            }`}
                                        title={isRecording ? t('voice_input_stop') : t('voice_input_start')}
                                    >
                                        {isRecording ? <AudioOutlined /> : <AudioMutedOutlined />}
                                    </Button>
                                    {/* Send button */}
                                    <Button
                                        type='text'
                                        onClick={handleSendMessage}
                                        disabled={!query.trim() || !hasValidProvider}
                                        className={`!p-0 !w-9 !h-9 !min-w-0 flex items-center justify-center text-lg rounded-lg transition-all duration-200
                                            ${(!query.trim() || !hasValidProvider)
                                                ? '!text-gray-300 dark:!text-gray-600 cursor-not-allowed'
                                                : 'cursor-pointer hover:!bg-primary/10 dark:hover:!bg-purple-500/20 !text-primary dark:!text-purple-400 hover:!text-primary-hover dark:hover:!text-purple-300'
                                            }`}
                                        title={!hasValidProvider ? (t('no_provider_tooltip') || 'Configure AI provider first') : ''}
                                    >
                                        <SendMessage/>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Bottom background decoration */}
                <div className='absolute bottom-0 w-full h-[212px] bg-main-view-footer dark:bg-main-view-footer-dark bg-cover bg-no-repeat bg-center'></div>
            </div>

            {/* Scheduled task related components */}
            <ScheduledTaskModal />
            <ScheduledTaskListPanel />
        </div>
    )
}