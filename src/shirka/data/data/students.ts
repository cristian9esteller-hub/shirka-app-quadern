
import { Student } from '../types';

export const studentsData: Student[] = [
  {
    id: 'pau-garcia-vila',
    name: 'Pau Garcia Vila',
    classId: '4t-primaria-b',
    avatar: 'https://picsum.photos/id/1005/200/200',
    personalData: {
      birthDate: '14 Març 2014',
      age: 10,
      address: 'Carrer Major 45, 2n 1a, Barcelona',
      socialSecurity: '1234 5678 90 12',
    },
    tutors: [
      { name: 'Maria Garcia', relation: 'Mare / Tutora Legal', phone: '600 111 222', email: 'maria.garcia@example.com', initials: 'MG' },
      { name: 'Jordi Puig', relation: 'Pare', phone: '600 333 444', email: 'jordi.puig@example.com', initials: 'JP' },
    ],
    alerts: [
      { type: 'medical', icon: 'medical_services', text: 'Al·lèrgia: Nous', color: 'red' },
      { type: 'academic', icon: 'psychology', text: 'Reforç Lectura', color: 'blue' },
      { type: 'other', icon: 'restaurant', text: 'Menjador (Dill-Dim)', color: 'amber' },
    ],
    privateNotes: "Mostra molt interès en les ciències naturals, especialment en els animals. A vegades es distreu durant les classes de matemàtiques, però respon bé als recordatoris positius. Cal animar-lo a participar més en les activitats de grup.",
    behaviorLog: [
       { id: 'log1', type: 'negative', icon: 'warning', color: 'red', title: 'Conflicte al pati', date: 'Avui, 11:30', description: 'Ha tingut una petita discussió amb un company pel torn del futbol.' },
       { id: 'log2', type: 'positive', icon: 'star', color: 'green', title: 'Millora en matemàtiques', date: 'Ahir, 15:00', description: 'Ha acabat tots els exercicis de fraccions sense ajuda.', tags: ['Matemàtiques'] },
       { id: 'log3', type: 'neutral', icon: 'chat', color: 'blue', title: 'Reunió amb la família', date: '10 Oct, 17:00', description: 'Tutoria trimestral. Es comenta la necessitat de reforçar la lectura.' },
    ]
  },
  {
    id: 'alba-martinez',
    name: 'Alba Martínez',
    classId: '4t-primaria-b',
    avatar: 'https://picsum.photos/id/1011/200/200',
    personalData: {
      birthDate: '22 Juliol 2014',
      age: 10,
      address: 'Plaça Nova 10, 1r, Barcelona',
      socialSecurity: '0987 6543 21 09',
    },
    tutors: [
      { name: 'Laura López', relation: 'Mare / Tutora Legal', phone: '611 222 333', email: 'laura.lopez@example.com', initials: 'LL' },
    ],
    alerts: [
       { type: 'medical', icon: 'eyeglasses', text: 'Porta ulleres', color: 'blue' },
    ],
    privateNotes: "Alumna molt participativa i creativa. Destaca en educació artística i llengua. A vegades li costa mantenir l'ordre en el seu material.",
    behaviorLog: [
       { id: 'log4', type: 'positive', icon: 'emoji_events', color: 'green', title: 'Premi de dibuix', date: '15 Oct, 12:00', description: "Guanyadora del concurs de dibuix de la tardor de l'escola.", tags: ['Artística'] },
    ]
  },
  {
    id: 'bernat-ferrer',
    name: 'Bernat Ferrer',
    classId: '4t-primaria-b',
    avatar: 'https://picsum.photos/id/1012/200/200',
    personalData: {
      birthDate: '5 Gener 2014',
      age: 10,
      address: 'Avinguda Central 123, 4t 2a, Barcelona',
      socialSecurity: '5555 4444 33 22',
    },
    tutors: [
       { name: 'Carles Ferrer', relation: 'Pare / Tutor Legal', phone: '622 333 444', email: 'carles.ferrer@example.com', initials: 'CF' },
       { name: 'Sònia Camps', relation: 'Mare', phone: '633 444 555', email: 'sonia.camps@example.com', initials: 'SC' },
    ],
    alerts: [],
    privateNotes: "Té dificultats amb la comprensió lectora. S'ha establert un pla de reforç amb la família. Molt bo en educació física i treball en equip.",
    behaviorLog: [
       { id: 'log5', type: 'neutral', icon: 'chat', color: 'blue', title: 'Seguiment del reforç', date: '18 Oct, 16:30', description: "Reunió amb el pare per valorar positivament l'evolució del pla de lectura a casa." },
    ]
  },
  {
    id: 'carla-sole',
    name: 'Carla Solé',
    classId: '4t-primaria-b',
    avatar: 'https://picsum.photos/id/1013/200/200',
    personalData: {
      birthDate: '30 Novembre 2014',
      age: 9,
      address: 'Carrer del Pi 5, baixos, Barcelona',
      socialSecurity: '9876 1234 56 78',
    },
    tutors: [
       { name: 'Raquel Pons', relation: 'Mare / Tutora Legal', phone: '644 555 666', email: 'raquel.pons@example.com', initials: 'RP' },
    ],
    alerts: [
      { type: 'medical', icon: 'medical_services', text: 'Asma (inhalador)', color: 'red' },
    ],
    privateNotes: "Alumna tranquil·la i responsable. Sempre porta els deures fets. A vegades li fa vergonya preguntar dubtes davant de tota la classe, prefereix fer-ho en privat.",
    behaviorLog: [
        { id: 'log6', type: 'positive', icon: 'volunteer_activism', color: 'green', title: 'Ajuda a un company', date: '20 Oct, 10:15', description: "Ha ajudat de manera espontània a un company que no entenia un problema de matemàtiques." },
    ]
  },
];
