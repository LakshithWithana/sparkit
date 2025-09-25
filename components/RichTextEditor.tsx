"use client";

import React, { useState, useRef, useEffect } from "react";

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
                                                           value,
                                                           onChange,
                                                           placeholder = "Start writing your chapter..."
                                                       }) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const [isFocused, setIsFocused] = useState(false);

    useEffect(() => {
        if (editorRef.current && editorRef.current.innerHTML !== value) {
            // Set content preserving HTML formatting
            editorRef.current.innerHTML = value || '';
        }
    }, [value]);

    const handleInput = () => {
        if (editorRef.current) {
            // Get HTML content to preserve formatting
            const htmlContent = editorRef.current.innerHTML;
            onChange(htmlContent);
        }
    };

    const executeCommand = (command: string) => {
        document.execCommand(command, false, undefined);
        editorRef.current?.focus();
        handleInput();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        // Handle keyboard shortcuts
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case 'b':
                    e.preventDefault();
                    executeCommand('bold');
                    break;
                case 'i':
                    e.preventDefault();
                    executeCommand('italic');
                    break;
            }
        }

        // Handle Enter key for paragraph breaks
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            executeCommand('insertHTML');
            // Insert proper paragraph structure
            document.execCommand('insertHTML', false, '<br><br>');
            handleInput();
        } else if (e.key === 'Enter' && e.shiftKey) {
            // Shift+Enter for single line break
            e.preventDefault();
            document.execCommand('insertHTML', false, '<br>');
            handleInput();
        }
    };

    const getWordCount = () => {
        if (!editorRef.current) return 0;
        const text = editorRef.current.textContent || '';
        return text.split(/\s+/).filter(word => word.length > 0).length;
    };

    return (
        <div className={`border rounded-md ${isFocused ? 'ring-2 ring-indigo-500 border-indigo-500' : 'border-gray-300'}`}>
            {/* Toolbar */}
            <div className="flex items-center space-x-2 p-3 border-b border-gray-200 bg-gray-50 rounded-t-md">
                <button
                    type="button"
                    onClick={() => executeCommand('bold')}
                    className="px-3 py-1 text-sm font-bold text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    title="Bold (Ctrl+B)"
                >
                    B
                </button>

                <button
                    type="button"
                    onClick={() => executeCommand('italic')}
                    className="px-3 py-1 text-sm italic text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    title="Italic (Ctrl+I)"
                >
                    I
                </button>

                <div className="flex-1"></div>

                <div className="text-xs text-gray-500">
                    <span>Words: {getWordCount()}</span>
                    <span className="ml-3 text-gray-400">Enter: New paragraph • Shift+Enter: Line break</span>
                </div>
            </div>

            {/* Editor */}
            <div
                ref={editorRef}
                contentEditable
                onInput={handleInput}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                onKeyDown={handleKeyDown}
                className="min-h-[400px] p-4 text-gray-900 focus:outline-none prose prose-gray max-w-none"
                style={{
                    lineHeight: '1.8',      // Match FormattedTextDisplay
                    fontSize: '16px',       // Match FormattedTextDisplay
                }}
                data-placeholder={placeholder}
                suppressContentEditableWarning={true}
            />

            <style jsx>{`
                [contenteditable]:empty:before {
                    content: attr(data-placeholder);
                    color: #9ca3af;
                    pointer-events: none;
                }

                [contenteditable] {
                    font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                }

                /* Match paragraph spacing from FormattedTextDisplay */
                [contenteditable] p {
                    margin: 1.33333em 0;
                }

                /* Ensure consistent bold and italic rendering */
                [contenteditable] b, [contenteditable] strong {
                    font-weight: 600;
                }

                [contenteditable] i, [contenteditable] em {
                    font-style: italic;
                }

                /* Handle line breaks properly */
                [contenteditable] br {
                    line-height: 1.8;
                }
            `}</style>
        </div>
    );
};

export default RichTextEditor;