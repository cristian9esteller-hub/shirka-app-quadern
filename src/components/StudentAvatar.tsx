import React from 'react';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { cn } from '@/lib/utils';
import { Student } from '@/types';
import { getAvatarSrc } from '@/lib/avatar-utils';

interface StudentAvatarProps {
    student: Student;
    size?: 'sm' | 'md' | 'list' | 'lg' | 'xl';
    className?: string;
    onClick?: () => void;
    variant?: 'default' | 'framed' | 'compact';
}

const sizeMap = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    list: 'h-12 w-12',
    lg: 'h-24 w-24 md:h-28 md:h-28',
    xl: 'h-32 w-32'
};

export const StudentAvatar: React.FC<StudentAvatarProps> = ({
    student,
    size = 'md',
    className,
    onClick,
    variant = 'framed'
}) => {
    const src = getAvatarSrc(student);

    return (
        <div
            className={cn(
                "relative flex shrink-0 transition-all",
                sizeMap[size],
                variant === 'framed' && "p-0.5 rounded-full border-2 border-border bg-background shadow-sm hover:border-primary/50 transition-colors",
                onClick && "cursor-pointer active:scale-95",
                className
            )}
            onClick={onClick}
        >
            <Avatar className="w-full h-full rounded-full overflow-hidden">
                <AvatarImage
                    src={src}
                    alt={student.name}
                    className="aspect-square h-full w-full object-cover"
                />
                <AvatarFallback className="text-xs uppercase bg-secondary">
                    {student.name.substring(0, 2)}
                </AvatarFallback>
            </Avatar>
        </div>
    );
};
