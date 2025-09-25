"use client";

import React from "react";

interface FormattedTextDisplayProps {
    content: string;
    className?: string;
}

const FormattedTextDisplay: React.FC<FormattedTextDisplayProps> = ({
                                                                       content,
                                                                       className = ""
                                                                   }) => {
    // Enhanced HTML sanitization and formatting
    const processContent = (html: string) => {
        let processed = html
            // Remove all HTML tags except allowed ones
            .replace(/<(?!\/?(?:b|strong|i|em|br|p|div)\b)[^>]*>/gi, '')
            // Convert various line break patterns to proper breaks
            .replace(/\n\s*\n/g, '</p><p>')  // Double line breaks = paragraph breaks
            .replace(/\n/g, '<br>')          // Single line breaks = line breaks
            // Handle div tags as paragraph breaks
            .replace(/<\/div>\s*<div[^>]*>/gi, '</p><p>')
            .replace(/<div[^>]*>/gi, '<p>')
            .replace(/<\/div>/gi, '</p>')
            // Clean up multiple consecutive breaks
            .replace(/(<br\s*\/?>\s*){3,}/gi, '</p><p>')
            // Handle empty paragraphs
            .replace(/<p>\s*<\/p>/gi, '')
            .replace(/<p>\s*(<br\s*\/?>)+\s*<\/p>/gi, '')
            // Decode HTML entities
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&amp;/g, '&')
            .replace(/&nbsp;/g, ' ');

        // Ensure content is wrapped in paragraphs if not already (ES5 compatible)
        if (processed && !processed.trim().startsWith('<p>') && !processed.trim().startsWith('<br>')) {
            processed = `<p>${processed}</p>`;
        }

        // Clean up any malformed paragraph tags at start/end
        processed = processed
            .replace(/^<\/p>/, '')
            .replace(/<p>$/, '');

        return processed;
    };

    const processedContent = processContent(content);

    return (
        <div
            className={`prose prose-gray max-w-none ${className}`}
            dangerouslySetInnerHTML={{
                __html: processedContent
            }}
            style={{
                lineHeight: '1.8',
                fontSize: '16px'
            }}
        />
    );
};

export default FormattedTextDisplay;