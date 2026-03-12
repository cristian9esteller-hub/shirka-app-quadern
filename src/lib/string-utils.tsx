import React from 'react';
import Icon from '@/components/Icon';

/**
 * Detects specialized service icons for URLs.
 */
const getLinkIcon = (url: string) => {
    const lowUrl = url.toLowerCase();
    if (lowUrl.includes('youtube.com') || lowUrl.includes('youtu.be')) return 'smart_display';
    if (lowUrl.includes('docs.google.com/document')) return 'description';
    if (lowUrl.includes('docs.google.com/presentation')) return 'present_to_all';
    if (lowUrl.includes('docs.google.com/spreadsheets')) return 'table_view';
    if (lowUrl.includes('drive.google.com')) return 'cloud_queue';
    return 'link';
};

/**
 * Detects URLs in a string and returns a React node with clickable links.
 * Handles http://, https:// and www.
 */
export const renderTextWithLinks = (text: string) => {
    if (!text) return null;

    // Regex to match http/https and www links
    const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+\.[^\s]+|www\.[^\s]+\/?[^\s]*)/gi;

    const parts = text.split(urlRegex);

    return parts.map((part, index) => {
        if (part.match(urlRegex)) {
            const href = part.toLowerCase().startsWith('www.') ? `https://${part}` : part;
            const iconName = getLinkIcon(href);

            return (
                <a
                    key={index}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-1.5 my-1 rounded-xl bg-primary/5 dark:bg-primary/10 border border-primary/10 dark:border-primary/20 text-primary dark:text-blue-400 font-bold text-[11px] hover:bg-white dark:hover:bg-slate-800 hover:border-primary/30 hover:shadow-sm transition-all break-all decoration-transparent"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="w-5 h-5 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        <Icon name={iconName} className="text-[14px]" />
                    </div>
                    {part}
                </a>
            );
        }
        return <span key={index}>{part}</span>;
    });
};
