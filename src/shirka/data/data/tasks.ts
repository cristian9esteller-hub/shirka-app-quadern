
import { Task } from '../types';

export const initialTasks: Task[] = [
    { id: '1', text: 'Corregir exàmens de Mates', completed: false, tags: [{ text: 'Urgent', color: 'red' }, { text: '3r B', color: 'slate' }] },
    { id: '2', text: 'Preparar fitxes de lectura', completed: false, tags: [{ text: 'Demà', color: 'slate' }] },
    { id: '3', text: 'Reunió amb pares de la Laia', completed: false, tags: [{ text: 'Tutoria', color: 'purple' }, { text: '16:30', color: 'slate' }] },
    { id: '4', text: 'Enviar correu excursió', completed: true, tags: [] },
];
