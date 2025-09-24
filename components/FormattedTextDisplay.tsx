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
    // Sanitize HTML to only allow bold and italic tags
    const sanitizeHTML = (html: string) => {
        // Remove all HTML tags except <b>, <strong>, <i>, <em>, and <br>
        return html
            .replace(/<(?!\/?(?:b|strong|i|em|br)\b)[^>]*>/gi, '') // Remove all tags except allowed ones
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&amp;/g, '&')
            .replace(/&nbsp;/g, ' ');
    };

    const sanitizedContent = sanitizeHTML(content);

    return (
        <div
            className={`text-gray-900 prose prose-gray max-w-none ${className}`}
            dangerouslySetInnerHTML={{
                __html: sanitizedContent
            }}
            style={{
                lineHeight: '1.8',
                fontSize: '16px'
            }}
        />
    );
};

export default FormattedTextDisplay;