import alumno1 from '@/assets/alumno1.png';
import alumno2 from '@/assets/alumno2.png';
import alumna1 from '@/assets/alumna1.png';
import alumna2 from '@/assets/alumna2.png';
import professorIcon from '@/assets/professor.png';
import professoraIcon from '@/assets/professora.png';
import type { Student } from '@/types';

export const getAvatarSrc = (student: Student) => {
    if (student.avatar && !student.avatar.includes('dicebear.com')) return student.avatar;

    const isFemale = student.gender === 'nena' || (student.gender === 'altre' && student.name.toLowerCase().endsWith('a'));
    const sum = student.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const random = sum % 2 === 0;

    if (isFemale) return random ? alumna1 : alumna2;
    return random ? alumno1 : alumno2;
};

export const getProfessorAvatar = (name: string, gender?: string) => {
    if (gender === 'female') return professoraIcon;
    if (gender === 'male') return professorIcon;
    const nameLower = name.toLowerCase();
    if (nameLower.endsWith('a')) return professoraIcon;
    return professorIcon;
};

export const PREDEFINED_AVATARS = [alumno1, alumno2, alumna1, alumna2];
