import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Header from '@/components/Header'
import { Input, Button, App } from 'antd'
import { AudioOutlined, AudioMutedOutlined } from '@ant-design/icons'
import { ScheduledTaskModal, ScheduledTaskListPanel } from '@/components/scheduled-task'
import { useScheduledTaskStore } from '@/stores/scheduled-task-store'
import { ModelConfigBar } from '@/components/ModelConfigBar'
import { ChromeBrowserBackground } from '@/components/fellou/ChromeBrowserBackground'
import { useTranslation } from 'react-i18next'
import { useVoiceInput } from '@/hooks/useVoiceInput'

export default function Home() {
    const [query, setQuery] = useState('')
    const router = useRouter()
    const { t } = useTranslation('home')
    const { message: antdMessage } = App.useApp()

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
    const handleSendMessage = () => {
        if (query.trim()) {
            // Use sessionStorage to implicitly pass message
            if (typeof window !== 'undefined') {
                sessionStorage.setItem('pendingMessage', query.trim())
            }
            // Directly navigate to main page without URL parameters
            router.push('/main')
        }
    }

    // Handle Enter key
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSendMessage()
        }
    }

    return (
        <>
            <ChromeBrowserBackground/>
            <Header />
            <div className='bg-main-view bg-origin-padding bg-no-repeat bg-cover h-[calc(100%_-_48px)] overflow-y-auto text-text-01-dark flex flex-col'>
                <div className='flex flex-col items-center pt-[130px] w-full h-full overflow-y-auto z-10'>
                    {/* Greeting */}
                    <div className='text-left leading-10 text-text-01-dark text-[28px] font-bold'>
                        <div>{t('greeting_name')}</div>
                        <p>{t('greeting_intro')}</p>
                    </div>

                    {/* Unified Input Area: Model Config + Query Input */}
                    <div className='gradient-border w-[740px] mt-[30px]' style={{ height: 'auto' }}>
                        <div className='bg-tool-call rounded-xl w-full h-full'>
                            {/* Model Configuration Bar */}
                            <ModelConfigBar />

                            {/* Query input box */}
                            <div className='h-[160px] p-4'>
                                <div className='relative h-full border border-solid border-white/20 rounded'>
                                    <Input.TextArea
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        className='!h-full !bg-transparent !text-text-01-dark !placeholder-text-12-dark !py-3 !px-4 !pr-12 !border-none !outline-none focus:!shadow-none'
                                        placeholder={t('input_placeholder')}
                                        autoSize={false}
                                    />
                                    {/* Voice input button */}
                                    <Button
                                        type='text'
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            toggleRecording();
                                        }}
                                        className='!p-0 !w-8 !h-8 !min-w-0 !flex !items-center !justify-center !absolute !bottom-3 !right-3 !text-lg'
                                        title={isRecording ? t('voice_input_stop') : t('voice_input_start')}
                                    >
                                        {isRecording ? <AudioOutlined /> : <AudioMutedOutlined />}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Bottom background decoration */}
                <div className='absolute bottom-0 w-full h-[212px] bg-main-view-footer bg-cover bg-no-repeat bg-center'></div>
            </div>

            {/* Scheduled task related components */}
            <ScheduledTaskModal />
            <ScheduledTaskListPanel />
        </>
    )
}