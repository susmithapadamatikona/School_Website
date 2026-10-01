/* ==========================================================================
   EDUCARE — Demo data
   ---------------------------------------------------------------------------
   EDU.content  : static website content (programs, departments, blog, ...)
   EDU.seed()   : initial records written to LocalStorage on first visit.
   Dates are generated relative to "today" so the demo always looks current.
   In production these objects would come from REST/GraphQL endpoints.
   ========================================================================== */
(function (EDU) {
    'use strict';
    const U = EDU.utils;
    const rel = U.rel;

    /* ------------------------------------------------------------------ */
    /* Reference data                                                      */
    /* ------------------------------------------------------------------ */
    const SCHOOL = {
        name: 'EDUCARE International School',
        short: 'EDUCARE',
        tagline: 'Empowering Young Minds for a Brighter Future',
        founded: 2001,
        address: 'Survey No. 42, Knowledge City Road, Gachibowli, Hyderabad, Telangana 500032, India',
        phone: '+91 40 4455 2026',
        admissionsPhone: '+91 98480 22026',
        email: 'info@educare.edu',
        admissionsEmail: 'admissions@educare.edu',
        hours: 'Mon – Fri: 8:00 AM – 4:30 PM · Sat: 8:00 AM – 1:00 PM',
        coords: [17.4401, 78.3489],
        principal: { name: 'Dr. Meera Krishnan', title: 'Principal', photo: 'w6', experience: 26, qualification: 'Ph.D. Education (University of Hyderabad), M.Ed.' },
        stats: { students: 2548, teachers: 152, parents: 3910, years: 25, programs: 32, awards: 54, success: 98 }
    };

    const SUBJECTS = {
        'Mathematics': { icon: 'fa-square-root-variable', color: '#013431' },
        'Physics': { icon: 'fa-atom', color: '#7356D8' },
        'Chemistry': { icon: 'fa-flask', color: '#159B78' },
        'Biology': { icon: 'fa-dna', color: '#16A085' },
        'Science': { icon: 'fa-microscope', color: '#16A085' },
        'English': { icon: 'fa-book-open', color: '#F59E0B' },
        'Computer Science': { icon: 'fa-laptop-code', color: '#2196F3' },
        'Social Studies': { icon: 'fa-earth-asia', color: '#EC4899' },
        'French': { icon: 'fa-language', color: '#E74C3C' },
        'Hindi': { icon: 'fa-language', color: '#F97316' },
        'Physical Education': { icon: 'fa-person-running', color: '#159B78' },
        'Art': { icon: 'fa-palette', color: '#D946EF' },
        'Music': { icon: 'fa-music', color: '#6366F1' },
        'Clubs & Activities': { icon: 'fa-people-group', color: '#159B78' }
    };

    const TEACHERS = [
        { id: 'T001', name: 'Priya Menon', gender: 'F', photo: 'w1', department: 'Mathematics', designation: 'Head of Department – Mathematics', qualification: 'M.Sc. Mathematics, B.Ed.', experience: 14, subjects: ['Algebra', 'Calculus', 'Statistics'], email: 'priya.menon@educare.edu', phone: '+91 98480 11001', classes: ['10-A', '10-B', '9-A', '9-B'], rating: 4.9, bio: 'Priya makes abstract ideas tangible through real-world problem solving and has mentored three national Math Olympiad finalists.' },
        { id: 'T002', name: 'Daniel Brooks', gender: 'M', photo: 'm1', department: 'Science', designation: 'Senior Physics Teacher', qualification: 'M.Sc. Physics (Edinburgh), PGCE', experience: 11, subjects: ['Physics', 'Astronomy'], email: 'daniel.brooks@educare.edu', phone: '+91 98480 11002', classes: ['10-A', '10-B', '11-Sci'], rating: 4.8, bio: 'Daniel leads the school astronomy club and designs hands-on lab experiences for senior physics students.' },
        { id: 'T003', name: 'Ananya Iyer', gender: 'F', photo: 'w2', department: 'Science', designation: 'Chemistry Teacher', qualification: 'M.Sc. Chemistry, B.Ed.', experience: 9, subjects: ['Chemistry', 'Environmental Chemistry'], email: 'ananya.iyer@educare.edu', phone: '+91 98480 11003', classes: ['10-A', '10-B', '12-Sci'], rating: 4.7, bio: 'Ananya brings chemistry to life with green-lab experiments and inquiry-based learning.' },
        { id: 'T004', name: 'Rohan Kapoor', gender: 'M', photo: 'm2', department: 'Computer Science', designation: 'Head of Department – Computer Science', qualification: 'M.Tech. Computer Science (IIIT-H)', experience: 8, subjects: ['Python', 'Web Development', 'AI Basics'], email: 'rohan.kapoor@educare.edu', phone: '+91 98480 11004', classes: ['10-A', '10-B', '9-A'], rating: 4.9, bio: 'Rohan coaches the school coding team and runs the annual EDUCARE Hackathon.' },
        { id: 'T005', name: 'Sarah Thompson', gender: 'F', photo: 'w3', department: 'English', designation: 'Head of Department – English', qualification: 'M.A. English Literature (Oxford), CELTA', experience: 15, subjects: ['Literature', 'Creative Writing', 'Debate'], email: 'sarah.thompson@educare.edu', phone: '+91 98480 11005', classes: ['10-A', '10-B', '9-A', '9-B'], rating: 4.8, bio: 'Sarah leads the Literary Society and has guided students to international Model UN awards.' },
        { id: 'T006', name: 'Vikram Nair', gender: 'M', photo: 'm3', department: 'Social Studies', designation: 'Senior History & Civics Teacher', qualification: 'M.A. History, M.Ed.', experience: 12, subjects: ['History', 'Civics', 'Geography'], email: 'vikram.nair@educare.edu', phone: '+91 98480 11006', classes: ['10-A', '10-B', '9-A'], rating: 4.6, bio: 'Vikram turns history into storytelling and organises heritage walks across Hyderabad.' },
        { id: 'T007', name: 'Fatima Sheikh', gender: 'F', photo: 'w4', department: 'Languages', designation: 'French Language Teacher', qualification: 'M.A. French (EFLU), DELF C1', experience: 7, subjects: ['French', 'Global Cultures'], email: 'fatima.sheikh@educare.edu', phone: '+91 98480 11007', classes: ['10-A', '10-B', '9-B'], rating: 4.7, bio: 'Fatima coordinates our student exchange programme with Lycée International, Lyon.' },
        { id: 'T008', name: 'Kavya Reddy', gender: 'F', photo: 'w5', department: 'Science', designation: 'Biology Teacher', qualification: 'M.Sc. Biotechnology, B.Ed.', experience: 10, subjects: ['Biology', 'General Science'], email: 'kavya.reddy@educare.edu', phone: '+91 98480 11008', classes: ['10-A', '6-B', '9-A'], rating: 4.8, bio: 'Kavya runs the Eco Club and our award-winning school biodiversity garden.' },
        { id: 'T009', name: 'Arjun Mehta', gender: 'M', photo: 'm4', department: 'Physical Education', designation: 'Director of Sports', qualification: 'M.P.Ed., NIS Certified Coach', experience: 13, subjects: ['Athletics', 'Football', 'Fitness'], email: 'arjun.mehta@educare.edu', phone: '+91 98480 11009', classes: ['All Grades'], rating: 4.9, bio: 'Arjun has coached EDUCARE teams to 18 state-level championships.' },
        { id: 'T010', name: 'Emily Carter', gender: 'F', photo: 'w7', department: 'Arts', designation: 'Visual Arts Teacher', qualification: 'MFA (Parsons School of Design)', experience: 6, subjects: ['Painting', 'Design', 'Sculpture'], email: 'emily.carter@educare.edu', phone: '+91 98480 11010', classes: ['6-B', '7-A', '8-A'], rating: 4.7, bio: 'Emily curates the annual student art exhibition "Canvas".' },
        { id: 'T011', name: 'Rahul Deshpande', gender: 'M', photo: 'm5', department: 'Music', designation: 'Music Director', qualification: 'M.A. Music, Trinity Grade 8', experience: 9, subjects: ['Vocal', 'Keyboard', 'Percussion'], email: 'rahul.deshpande@educare.edu', phone: '+91 98480 11011', classes: ['6-B', '7-A', '8-A'], rating: 4.8, bio: 'Rahul leads the school orchestra and the annual concert "Swaranjali".' },
        { id: 'T012', name: 'Neha Gupta', gender: 'F', photo: 'w8', department: 'Environmental Studies', designation: 'EVS & Geography Teacher', qualification: 'M.Sc. Environmental Science', experience: 5, subjects: ['EVS', 'Geography', 'Sustainability'], email: 'neha.gupta@educare.edu', phone: '+91 98480 11012', classes: ['6-B', '5-A', '4-A'], rating: 4.6, bio: 'Neha drives our zero-waste campus initiative.' },
        { id: 'T013', name: 'Meenakshi Pillai', gender: 'F', photo: 'w9', department: 'Languages', designation: 'Senior Hindi Teacher', qualification: 'M.A. Hindi, B.Ed.', experience: 18, subjects: ['Hindi', 'Sanskrit'], email: 'meenakshi.pillai@educare.edu', phone: '+91 98480 11013', classes: ['6-B', '9-A', '9-B'], rating: 4.7, bio: 'Meenakshi directs the annual Hindi Diwas elocution and poetry festival.' },
        { id: 'T014', name: 'Michael Fernandes', gender: 'M', photo: 'm6', department: 'Mathematics', designation: 'Mathematics Teacher', qualification: 'M.Sc. Applied Mathematics, B.Ed.', experience: 4, subjects: ['Arithmetic', 'Geometry'], email: 'michael.fernandes@educare.edu', phone: '+91 98480 11014', classes: ['6-B', '7-A'], rating: 4.6, bio: 'Michael uses games and puzzles to build number sense in middle school.' },
        { id: 'T015', name: 'Lakshmi Venkat', gender: 'F', photo: 'w6', department: 'English', designation: 'Primary English Coordinator', qualification: 'M.A. English, Montessori Diploma', experience: 20, subjects: ['Phonics', 'Reading', 'Grammar'], email: 'lakshmi.venkat@educare.edu', phone: '+91 98480 11015', classes: ['6-B', '3-A', '4-A'], rating: 4.9, bio: 'Lakshmi designed our primary reading programme "Little Readers, Big Dreams".' },
        { id: 'T016', name: 'Karthik Rao', gender: 'M', photo: 'm7', department: 'Computer Science', designation: 'Robotics & Coding Instructor', qualification: 'B.Tech. ECE, Certified LEGO Education Trainer', experience: 6, subjects: ['Robotics', 'Scratch', 'Arduino'], email: 'karthik.rao@educare.edu', phone: '+91 98480 11016', classes: ['6-B', '7-A', '8-A'], rating: 4.8, bio: 'Karthik mentors the robotics team that won the 2025 FIRST LEGO League regional.' }
    ];

    const CLASS_SUBJECTS = {
        senior: [['Mathematics', 'T001'], ['Physics', 'T002'], ['Chemistry', 'T003'], ['Biology', 'T008'], ['English', 'T005'], ['Computer Science', 'T004'], ['Social Studies', 'T006'], ['French', 'T007'], ['Physical Education', 'T009']],
        middle: [['Mathematics', 'T014'], ['Science', 'T008'], ['English', 'T015'], ['Social Studies', 'T012'], ['Hindi', 'T013'], ['Computer Science', 'T016'], ['Art', 'T010'], ['Music', 'T011'], ['Physical Education', 'T009']]
    };
    const CLASSES = [
        { id: '10-A', grade: 10, section: 'A', room: 'Room 204', classTeacher: 'T001', track: 'senior', strength: 42 },
        { id: '10-B', grade: 10, section: 'B', room: 'Room 205', classTeacher: 'T005', track: 'senior', strength: 40 },
        { id: '9-A', grade: 9, section: 'A', room: 'Room 108', classTeacher: 'T006', track: 'senior', strength: 41 },
        { id: '9-B', grade: 9, section: 'B', room: 'Room 109', classTeacher: 'T007', track: 'senior', strength: 39 },
        { id: '6-B', grade: 6, section: 'B', room: 'Room 012', classTeacher: 'T015', track: 'middle', strength: 36 }
    ];
    const ROOMS = { Physics: 'Physics Lab', Chemistry: 'Chemistry Lab', Biology: 'Biology Lab', Science: 'Science Lab 1', 'Computer Science': 'Computer Lab 2', 'Physical Education': 'Sports Ground', Art: 'Art Studio', Music: 'Music Room' };
    const TIMES = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00'];
    const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    /* ------------------------------------------------------------------ */
    /* Website content                                                     */
    /* ------------------------------------------------------------------ */
    const content = {
        school: SCHOOL,
        subjects: SUBJECTS,
        programs: [
            { id: 'pre-primary', name: 'Pre-Primary', grades: 'Nursery – KG 2', age: '3–5 yrs', img: 'kidsGroup', icon: 'fa-shapes', desc: 'A joyful, play-based foundation that nurtures curiosity, language, motor skills and social confidence.', curriculum: 'Montessori-inspired Early Years Framework', activities: 'Storytelling, phonics, sensory play, music & movement', subjects: ['Phonics', 'Numeracy', 'Art & Craft', 'Music', 'Motor Skills', 'Social Skills'] },
            { id: 'primary', name: 'Primary School', grades: 'Grades 1 – 5', age: '6–10 yrs', img: 'kidWriting', icon: 'fa-pencil', desc: 'Strong literacy and numeracy built through inquiry projects, reading programmes and hands-on discovery.', curriculum: 'CBSE with Cambridge Primary enrichment', activities: 'Reading club, robotics junior, yoga, field trips', subjects: ['English', 'Mathematics', 'EVS', 'Hindi', 'Computer', 'Art'] },
            { id: 'middle', name: 'Middle School', grades: 'Grades 6 – 8', age: '11–13 yrs', img: 'kidStudy', icon: 'fa-flask-vial', desc: 'Subject specialists, lab-based science and project work develop independent thinkers and collaborators.', curriculum: 'CBSE with STEM & Design Thinking', activities: 'Coding, Model UN Jr., science fair, sports houses', subjects: ['Mathematics', 'Science', 'English', 'Social Studies', 'Languages', 'Computer Science'] },
            { id: 'secondary', name: 'Secondary School', grades: 'Grades 9 – 10', age: '14–15 yrs', img: 'studyGroup', icon: 'fa-graduation-cap', desc: 'Rigorous board preparation balanced with leadership, research projects and career exploration.', curriculum: 'CBSE Secondary (AISSE)', activities: 'Olympiads, debate, robotics, community service', subjects: ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Social Studies'] },
            { id: 'higher-secondary', name: 'Higher Secondary', grades: 'Grades 11 – 12', age: '16–17 yrs', img: 'graduation', icon: 'fa-user-graduate', desc: 'Science, Commerce and Humanities streams with university counselling and competitive-exam mentoring.', curriculum: 'CBSE Senior Secondary (AISSCE)', activities: 'Research internships, entrepreneurship cell, JEE/NEET/SAT prep', subjects: ['PCM / PCB', 'Accountancy', 'Economics', 'Psychology', 'Computer Science', 'Fine Arts'] }
        ],
        departments: [
            { name: 'Mathematics', icon: 'fa-square-root-variable', color: '#013431', box: '', desc: 'From number sense to calculus, we build logical reasoning with Olympiad-level enrichment.', faculty: 18, hod: 'Priya Menon' },
            { name: 'Science', icon: 'fa-atom', color: '#7356D8', box: 'purple', desc: 'Physics, Chemistry and Biology taught through 6 modern labs and inquiry-based experiments.', faculty: 24, hod: 'Daniel Brooks' },
            { name: 'Computer Science', icon: 'fa-laptop-code', color: '#2196F3', box: 'sky', desc: 'Coding, robotics, AI and digital citizenship from Grade 1 in our Innovation Lab.', faculty: 11, hod: 'Rohan Kapoor' },
            { name: 'English', icon: 'fa-book-open', color: '#F59E0B', box: 'gold', desc: 'Literature, creative writing and public speaking that give every student a confident voice.', faculty: 20, hod: 'Sarah Thompson' },
            { name: 'Social Studies', icon: 'fa-earth-asia', color: '#EC4899', box: 'pink', desc: 'History, geography, civics and economics connecting students to India and the world.', faculty: 14, hod: 'Vikram Nair' },
            { name: 'Languages', icon: 'fa-language', color: '#E74C3C', box: 'red', desc: 'Hindi, Telugu, Sanskrit, French and German — fluency with cultural understanding.', faculty: 16, hod: 'Meenakshi Pillai' },
            { name: 'Arts', icon: 'fa-palette', color: '#D946EF', box: 'purple', desc: 'Painting, sculpture, design and theatre in dedicated studios that spark imagination.', faculty: 8, hod: 'Emily Carter' },
            { name: 'Physical Education', icon: 'fa-person-running', color: '#159B78', box: 'green', desc: '14 sports with professional coaches, fitness science and a culture of fair play.', faculty: 12, hod: 'Arjun Mehta' },
            { name: 'Music', icon: 'fa-music', color: '#6366F1', box: '', desc: 'Indian classical and Western music, orchestra, choir and digital music production.', faculty: 7, hod: 'Rahul Deshpande' },
            { name: 'Environmental Studies', icon: 'fa-leaf', color: '#159B78', box: 'teal', desc: 'Sustainability, ecology and climate literacy through our campus biodiversity garden.', faculty: 6, hod: 'Neha Gupta' }
        ],
        why: [
            { icon: 'fa-chalkboard-user', title: 'Experienced Teachers', text: '152 qualified educators with an average of 11 years experience and continuous training.', box: '' },
            { icon: 'fa-display', title: 'Modern Classrooms', text: '120 air-conditioned smart classrooms with interactive panels and ergonomic seating.', box: 'teal' },
            { icon: 'fa-brain', title: 'Smart Learning', text: 'Personalised learning paths, digital assessments and real-time progress analytics.', box: 'purple' },
            { icon: 'fa-shield-halved', title: 'Safe Campus', text: '24/7 CCTV, RFID attendance, trained security staff and a full-time medical team.', box: 'green' },
            { icon: 'fa-futbol', title: 'Sports Facilities', text: 'FIFA-standard turf, 25m pool, indoor arena, tennis and basketball courts.', box: 'gold' },
            { icon: 'fa-microchip', title: 'Technology Labs', text: 'Robotics, AI, IoT and 3D-printing labs that turn ideas into working prototypes.', box: 'sky' },
            { icon: 'fa-book-bookmark', title: 'Library', text: '28,000+ books, e-library access and a quiet reading lounge for every age group.', box: 'pink' },
            { icon: 'fa-hand-holding-heart', title: 'Student Counseling', text: 'Dedicated counsellors for wellbeing, study skills and career guidance.', box: 'red' },
            { icon: 'fa-bus', title: 'Transportation', text: 'GPS-tracked AC bus fleet on 24 routes with live tracking for parents.', box: 'gold' },
            { icon: 'fa-comments', title: 'Parent Communication', text: 'Real-time updates on attendance, homework, fees and results via the parent app.', box: 'teal' }
        ],
        facilities: [
            { id: 'main-campus', name: 'Main Campus', img: 'campus', icon: 'fa-building-columns', desc: 'A 22-acre green campus with four academic blocks, landscaped courtyards and solar-powered buildings designed for natural light and ventilation.', stats: [['22', 'Acres'], ['4', 'Academic Blocks'], ['1.2 MW', 'Solar Power']] },
            { id: 'smart-classrooms', name: 'Smart Classrooms', img: 'classroom', icon: 'fa-chalkboard', desc: 'Every classroom features 86" interactive panels, flexible seating and acoustic design, with a maximum of 30 students per section.', stats: [['120', 'Classrooms'], ['30', 'Max Class Size'], ['100%', 'Smart Panels']] },
            { id: 'science-labs', name: 'Science Labs', img: 'scienceLab', icon: 'fa-flask', desc: 'Separate physics, chemistry and biology labs for middle and senior school, equipped to university-level safety standards.', stats: [['6', 'Labs'], ['180+', 'Experiments'], ['1:15', 'Lab Ratio']] },
            { id: 'computer-labs', name: 'Computer & Innovation Labs', img: 'coding', icon: 'fa-computer', desc: 'Three computer labs, a robotics studio and a maker space with 3D printers, Arduino kits and AR/VR headsets.', stats: [['240', 'Workstations'], ['12', '3D Printers'], ['1 Gbps', 'Internet']] },
            { id: 'library', name: 'Library & Media Centre', img: 'library', icon: 'fa-book', desc: 'A two-level library with 28,000+ books, 60 periodicals, e-book access and collaborative study pods.', stats: [['28K+', 'Books'], ['5K+', 'E-Books'], ['120', 'Seats']] },
            { id: 'auditorium', name: 'Auditorium', img: 'auditorium', icon: 'fa-masks-theater', desc: 'An 800-seat auditorium with professional acoustics and lighting for concerts, theatre and assemblies.', stats: [['800', 'Seats'], ['4K', 'Projection'], ['Dolby', 'Audio']] },
            { id: 'sports', name: 'Sports Ground', img: 'football', icon: 'fa-futbol', desc: 'FIFA-standard football turf, 400m athletics track, cricket nets, and courts for tennis, basketball and volleyball.', stats: [['400m', 'Track'], ['14', 'Sports'], ['8', 'Courts']] },
            { id: 'pool', name: 'Swimming Pool', img: 'pool', icon: 'fa-person-swimming', desc: 'Temperature-controlled 25m pool with certified lifeguards and a separate learners pool for junior students.', stats: [['25m', 'Length'], ['6', 'Lanes'], ['2', 'Lifeguards']] },
            { id: 'cafeteria', name: 'Cafeteria', img: 'cafeteria', icon: 'fa-utensils', desc: 'Nutritionist-designed menus prepared fresh daily in an FSSAI-certified kitchen, with vegetarian and allergy-aware options.', stats: [['600', 'Seats'], ['4', 'Menus / Week'], ['100%', 'Fresh']] },
            { id: 'medical', name: 'Medical Room', img: 'medical', icon: 'fa-kit-medical', desc: 'A full-time doctor and two nurses, first-aid stations in every block and a tie-up with Continental Hospitals.', stats: [['1', 'Doctor'], ['2', 'Nurses'], ['24/7', 'Ambulance']] },
            { id: 'transport', name: 'Transportation', img: 'bus', icon: 'fa-bus', desc: 'A fleet of 42 GPS-tracked AC buses with female attendants, CCTV and live tracking in the parent portal.', stats: [['42', 'Buses'], ['24', 'Routes'], ['100%', 'GPS']] },
            { id: 'security', name: 'Security', img: 'security', icon: 'fa-shield-halved', desc: '180 CCTV cameras, RFID-based entry, visitor management and trained security personnel around the clock.', stats: [['180', 'CCTV'], ['RFID', 'Entry'], ['24/7', 'Guards']] }
        ],
        studentLife: [
            { name: 'Sports', icon: 'fa-futbol', img: 'football', desc: 'Football, cricket, athletics, swimming and 10 more sports with professional coaching.', members: 1450 },
            { name: 'Cultural Activities', icon: 'fa-masks-theater', img: 'audience', desc: 'Theatre productions, festivals and inter-house cultural competitions all year.', members: 820 },
            { name: 'Music', icon: 'fa-music', img: 'music', desc: 'Orchestra, choir, rock band and Indian classical ensembles.', members: 360 },
            { name: 'Dance', icon: 'fa-person-dress', img: 'dance', desc: 'Bharatanatyam, Kuchipudi, contemporary and hip-hop dance troupes.', members: 290 },
            { name: 'Art', icon: 'fa-palette', img: 'art', desc: 'Painting, ceramics, digital art and our annual "Canvas" exhibition.', members: 410 },
            { name: 'Debate', icon: 'fa-microphone', img: 'conference', desc: 'Parliamentary debate, Model UN and elocution competitions.', members: 180 },
            { name: 'Robotics', icon: 'fa-robot', img: 'robot', desc: 'FIRST LEGO League and WRO teams building autonomous robots.', members: 150 },
            { name: 'Coding', icon: 'fa-code', img: 'coding', desc: 'Competitive programming, app development and the annual hackathon.', members: 240 },
            { name: 'Science Club', icon: 'fa-flask', img: 'microscope', desc: 'Research projects, science fairs and visits to national labs.', members: 210 },
            { name: 'Eco Club', icon: 'fa-leaf', img: 'eco', desc: 'Zero-waste campus, tree plantation drives and a biodiversity garden.', members: 190 },
            { name: 'Leadership', icon: 'fa-flag', img: 'studyGroup', desc: 'Student council, house captains and leadership bootcamps.', members: 96 },
            { name: 'Community Service', icon: 'fa-hand-holding-heart', img: 'teacherKids', desc: 'Teaching programmes, donation drives and NGO partnerships.', members: 530 }
        ],
        sports: [
            { name: 'Football', icon: 'fa-futbol', img: 'football', coach: 'Arjun Mehta', achievements: 'State Champions 2025', desc: 'U-14 and U-17 squads training on our FIFA-standard turf.' },
            { name: 'Basketball', icon: 'fa-basketball', img: 'basketball', coach: 'Samuel D\'Souza', achievements: 'CBSE Cluster Winners', desc: 'Indoor and outdoor courts with evening floodlights.' },
            { name: 'Athletics', icon: 'fa-person-running', img: 'running', coach: 'Arjun Mehta', achievements: '12 National Medals', desc: '400m synthetic track, jumps pit and throws area.' },
            { name: 'Swimming', icon: 'fa-person-swimming', img: 'pool', coach: 'Nisha Rao', achievements: 'SGFI National Qualifiers', desc: 'Learn-to-swim through competitive squads.' },
            { name: 'Chess', icon: 'fa-chess-knight', img: 'chess', coach: 'FM Srinivas K.', achievements: '3 FIDE Rated Players', desc: 'Strategy, tactics and tournament preparation.' },
            { name: 'Cricket', icon: 'fa-baseball-bat-ball', img: 'running', coach: 'Ravi Teja', achievements: 'HCA U-16 Runners Up', desc: 'Turf wicket, bowling machines and 6 practice nets.' },
            { name: 'Tennis', icon: 'fa-table-tennis-paddle-ball', img: 'basketball', coach: 'Anita George', achievements: 'AITA Ranked Juniors', desc: 'Two synthetic courts and a table-tennis hall.' },
            { name: 'Yoga & Fitness', icon: 'fa-spa', img: 'running', coach: 'Deepa Nair', achievements: 'International Yoga Day Showcase', desc: 'Daily mindfulness, yoga and functional fitness.' }
        ],
        testimonials: [
            { name: 'Rajesh Sharma', role: 'Parent', grade: 'Father of Aarav (Grade 10) & Ananya (Grade 6)', photo: 'm8', rating: 5, text: 'The parent portal is a game-changer. I see attendance, homework and results the moment they are updated, and the teachers genuinely know my children as individuals.' },
            { name: 'Dr. Swati Kulkarni', role: 'Parent', grade: 'Mother of Ishaan (Grade 8)', photo: 'w2', rating: 5, text: 'Ishaan was a shy child. The debate club and the house system have transformed his confidence. EDUCARE balances academics and character beautifully.' },
            { name: 'Aditi Rao', role: 'Alumna', grade: 'Class of 2022 · IIT Bombay', photo: 'w8', rating: 5, text: 'The science labs and the mentorship I received for JEE were outstanding. My teachers believed in me long before I believed in myself.' },
            { name: 'Mohammed Irfan', role: 'Parent', grade: 'Father of Zara (Grade 3)', photo: 'm3', rating: 5, text: 'Safe transport with live bus tracking, a caring primary team and a joyful learning environment — we couldn\'t ask for more.' },
            { name: 'Kabir Malhotra', role: 'Student', grade: 'Grade 12 · Head Boy', photo: 'm7', rating: 5, text: 'From robotics to the student council, EDUCARE gave me space to explore. The online portal keeps all my assignments and schedules in one place.' },
            { name: 'Lisa Fernandes', role: 'Parent', grade: 'Mother of Tara (Grade 5)', photo: 'w4', rating: 4, text: 'The teachers are responsive and communication is excellent. Tara loves the library and the reading programme.' }
        ],
        achievements: [
            { year: '2026', title: 'Ranked #1 Day School in Hyderabad', text: 'Education World India School Rankings — top day school in Telangana for the third consecutive year.', icon: 'fa-trophy' },
            { year: '2025', title: 'FIRST LEGO League Regional Champions', text: 'Our robotics team "Circuit Breakers" won the South India regional and represented India in Houston.', icon: 'fa-robot' },
            { year: '2025', title: '100% CBSE Board Results', text: '42 students scored above 95% in Grade 12; school average of 89.6%.', icon: 'fa-award' },
            { year: '2024', title: 'Green School Award (Platinum)', text: 'CSE Green Schools Programme recognition for our zero-waste and solar campus.', icon: 'fa-leaf' },
            { year: '2023', title: 'National Science Olympiad — 6 Gold Medals', text: 'Students across Grades 6–10 secured international ranks.', icon: 'fa-medal' },
            { year: '2021', title: 'Cambridge Partner School', text: 'Accredited as a Cambridge Assessment International Education partner.', icon: 'fa-certificate' },
            { year: '2016', title: 'State Football Champions', text: 'Our U-17 team lifted the Telangana State School Games trophy.', icon: 'fa-futbol' },
            { year: '2001', title: 'EDUCARE Founded', text: 'Started with 180 students and 14 teachers on a 5-acre campus in Gachibowli.', icon: 'fa-school' }
        ],
        awards: [
            { title: 'Academic Excellence', count: 18, icon: 'fa-graduation-cap', box: '', desc: 'Board toppers, Olympiad ranks and scholarship winners.' },
            { title: 'Sports Awards', count: 64, icon: 'fa-trophy', box: 'gold', desc: 'State and national medals across 9 sports.' },
            { title: 'Science Competitions', count: 23, icon: 'fa-flask', box: 'purple', desc: 'INSPIRE MANAK, IRIS and national science fairs.' },
            { title: 'Cultural Awards', count: 31, icon: 'fa-masks-theater', box: 'pink', desc: 'Theatre, music and dance at inter-school festivals.' },
            { title: 'National Competitions', count: 15, icon: 'fa-flag', box: 'teal', desc: 'Debate, MUN, quiz and spelling bee championships.' },
            { title: 'Student Achievements', count: 120, icon: 'fa-star', box: 'green', desc: 'Individual recognitions in academics, arts and service.' }
        ],
        alumni: [
            { name: 'Aditi Rao', batch: 'Class of 2022', role: 'B.Tech Computer Science, IIT Bombay', photo: 'w8', quote: 'EDUCARE taught me to ask better questions.' },
            { name: 'Siddharth Varma', batch: 'Class of 2015', role: 'Product Manager, Google', photo: 'm2', quote: 'The coding club started it all for me.' },
            { name: 'Dr. Nandini Iyer', batch: 'Class of 2010', role: 'Paediatrician, AIIMS Delhi', photo: 'w5', quote: 'My biology teachers inspired a lifelong love for medicine.' },
            { name: 'Arvind Krishnan', batch: 'Class of 2012', role: 'Founder, GreenGrid Energy', photo: 'm5', quote: 'The Eco Club planted the seed for my startup.' },
            { name: 'Sana Qureshi', batch: 'Class of 2018', role: 'Olympic Swimming Trials Finalist', photo: 'w3', quote: 'Early-morning training at the EDUCARE pool shaped my discipline.' },
            { name: 'Rahul Menon', batch: 'Class of 2008', role: 'Associate Professor, Stanford University', photo: 'm1', quote: 'Teachers here treated curiosity as a superpower.' }
        ],
        faqs: [
            { cat: 'Admissions', q: 'When do admissions open for the academic year 2026–27?', a: 'Online registration opened on 1 September 2026 and continues until seats are filled. Early applications are strongly recommended for Grades 1, 6 and 11.' },
            { cat: 'Admissions', q: 'What is the age requirement for Nursery and Grade 1?', a: 'A child must be 3 years old for Nursery and 6 years old for Grade 1 as on 31 March 2027, in line with CBSE guidelines.' },
            { cat: 'Admissions', q: 'Is there an entrance assessment?', a: 'Grades 2 and above have an age-appropriate assessment in English, Mathematics and reasoning. Pre-primary admissions involve an informal interaction only.' },
            { cat: 'Admissions', q: 'Which documents are required?', a: 'Birth certificate, previous school report card and transfer certificate, Aadhaar (student and parents), passport-size photos and address proof.' },
            { cat: 'Academics', q: 'Which curriculum does EDUCARE follow?', a: 'We follow CBSE from Grades 1–12, enriched with Cambridge Primary, STEM and design-thinking programmes.' },
            { cat: 'Academics', q: 'What is the student–teacher ratio?', a: 'Our overall ratio is 17:1, with a maximum of 30 students per section and additional co-teachers in pre-primary.' },
            { cat: 'Fees', q: 'Can fees be paid in instalments?', a: 'Yes. Tuition can be paid annually, in three term instalments, or monthly through auto-debit. A 3% discount applies to annual payment.' },
            { cat: 'Fees', q: 'Are scholarships available?', a: 'Merit scholarships (up to 50% tuition) are offered for Grades 9–12, plus need-based financial aid and sibling concessions of 10%.' },
            { cat: 'Transport', q: 'Can I track my child\'s school bus?', a: 'Yes. All buses are GPS-enabled and parents can see live location, ETA and boarding alerts in the parent portal.' },
            { cat: 'Transport', q: 'Which areas are covered by school transport?', a: 'We run 24 routes covering Gachibowli, Kondapur, Madhapur, Jubilee Hills, Kukatpally, Miyapur, Manikonda, Narsingi and nearby areas.' },
            { cat: 'Campus Life', q: 'What are the school timings?', a: 'Monday to Friday 8:00 AM – 3:30 PM; Saturday 8:00 AM – 12:30 PM (activities and clubs). Pre-primary finishes at 12:30 PM.' },
            { cat: 'Campus Life', q: 'Is lunch provided at school?', a: 'Yes, a nutritious vegetarian lunch and two snacks are served daily. Menus are designed by our in-house nutritionist.' }
        ],
        feeStructure: [
            { grade: 'Nursery – KG 2', admission: 25000, tuition: 85000, activity: 6000, transport: 22000 },
            { grade: 'Grades 1 – 5', admission: 30000, tuition: 95000, activity: 7000, transport: 24000 },
            { grade: 'Grades 6 – 8', admission: 35000, tuition: 110000, activity: 8000, transport: 24000 },
            { grade: 'Grades 9 – 10', admission: 40000, tuition: 120000, activity: 8000, transport: 24000 },
            { grade: 'Grades 11 – 12', admission: 45000, tuition: 135000, activity: 9000, transport: 26000 }
        ],
        ageRequirements: [
            ['Nursery', '3+ years'], ['LKG', '4+ years'], ['UKG', '5+ years'], ['Grade 1', '6+ years'], ['Grade 6', '11+ years'], ['Grade 11', 'Passed Grade 10']
        ],
        admissionDates: [
            { date: '2026-09-01', title: 'Online Registration Opens', text: 'Application portal opens for all grades.' },
            { date: '2026-11-15', title: 'Campus Open House', text: 'Guided tours and meet-the-principal sessions.' },
            { date: '2026-12-10', title: 'Entrance Assessments Begin', text: 'Grades 2–9 and 11 (by appointment).' },
            { date: '2027-01-20', title: 'First Admission List', text: 'Offers released on the parent portal.' },
            { date: '2027-02-28', title: 'Fee Payment Deadline', text: 'Confirm your seat by paying the admission fee.' },
            { date: '2027-04-01', title: 'Academic Year Begins', text: 'Orientation week for new students.' }
        ],
        documents: [
            { icon: 'fa-file-lines', name: 'Birth Certificate', note: 'Municipal / government issued' },
            { icon: 'fa-id-card', name: 'Aadhaar Card', note: 'Student and both parents' },
            { icon: 'fa-file-contract', name: 'Transfer Certificate', note: 'Grades 2 and above' },
            { icon: 'fa-chart-column', name: 'Previous Report Card', note: 'Last two academic years' },
            { icon: 'fa-image-portrait', name: 'Passport Photos', note: '4 recent colour photos' },
            { icon: 'fa-house', name: 'Address Proof', note: 'Utility bill or rental agreement' },
            { icon: 'fa-syringe', name: 'Immunisation Record', note: 'For Nursery – Grade 2' },
            { icon: 'fa-file-medical', name: 'Medical Certificate', note: 'Fitness from a registered doctor' }
        ],
        gallery: [
            { img: 'campus', title: 'Main Academic Block', cat: 'Campus' }, { img: 'kidsClass', title: 'Grade 3 Storytelling', cat: 'Classrooms' },
            { img: 'football', title: 'U-17 Football Finals', cat: 'Sports' }, { img: 'scienceLab', title: 'Chemistry Practical', cat: 'Science Labs' },
            { img: 'concert', title: 'Swaranjali Concert', cat: 'Cultural Activities' }, { img: 'graduation', title: 'Graduation Day 2026', cat: 'Events' },
            { img: 'studyGroup', title: 'Collaborative Learning', cat: 'Students' }, { img: 'trip', title: 'Grade 8 Himalayan Trek', cat: 'Trips' },
            { img: 'library', title: 'Library & Media Centre', cat: 'Campus' }, { img: 'running', title: 'Inter-House Athletics', cat: 'Sports' },
            { img: 'microscope', title: 'Biology Research Project', cat: 'Science Labs' }, { img: 'audience', title: 'Annual Day Audience', cat: 'Events' },
            { img: 'classroom', title: 'Smart Classroom', cat: 'Classrooms' }, { img: 'art', title: 'Canvas Art Exhibition', cat: 'Cultural Activities' },
            { img: 'kidsGroup', title: 'Pre-Primary Play Day', cat: 'Students' }, { img: 'pool', title: 'Swimming Gala', cat: 'Sports' },
            { img: 'campus2', title: 'Central Courtyard', cat: 'Campus' }, { img: 'robot', title: 'Robotics Showcase', cat: 'Science Labs' },
            { img: 'celebration', title: 'Children\'s Day Carnival', cat: 'Events' }, { img: 'laptopStudents', title: 'Coding Bootcamp', cat: 'Classrooms' },
            { img: 'music', title: 'Music Room Rehearsal', cat: 'Cultural Activities' }, { img: 'eco', title: 'Eco Club Plantation Drive', cat: 'Trips' },
            { img: 'basketball', title: 'Basketball League', cat: 'Sports' }, { img: 'teacherKids', title: 'Reading Circle', cat: 'Students' }
        ],
        posts: [
            { id: 'p1', type: 'news', cat: 'Achievements', title: 'EDUCARE Ranked #1 Day School in Hyderabad for 2026', img: 'graduation', author: 'T005', date: rel(-3), read: 4, featured: true, tags: ['Rankings', 'Excellence'], excerpt: 'For the third consecutive year, EDUCARE tops the Education World India rankings for day schools in Telangana.' },
            { id: 'p2', type: 'news', cat: 'School News', title: 'New Innovation Lab with AI & 3D Printing Inaugurated', img: 'robot', author: 'T004', date: rel(-8), read: 3, tags: ['Technology', 'STEM'], excerpt: 'The 4,000 sq ft lab gives students access to AI kits, drones and industrial-grade 3D printers.' },
            { id: 'p3', type: 'news', cat: 'Events', title: 'Annual Science & Innovation Fair Returns This October', img: 'scienceLab', author: 'T002', date: rel(-5), read: 3, tags: ['Science', 'Events'], excerpt: 'Over 220 student projects will be showcased with judges from IIT Hyderabad and ISRO.' },
            { id: 'p4', type: 'blog', cat: 'Academic Tips', title: '7 Proven Study Techniques for Board Exam Success', img: 'study', author: 'T001', date: rel(-2), read: 6, featured: true, tags: ['Exams', 'Study Tips', 'Grade 10'], excerpt: 'Spaced repetition, active recall and past-paper practice — how our toppers prepare, step by step.' },
            { id: 'p5', type: 'blog', cat: 'Parent Resources', title: 'Balancing Screen Time: A Practical Guide for Parents', img: 'onlineClass', author: 'T015', date: rel(-6), read: 5, tags: ['Parenting', 'Wellbeing', 'Technology'], excerpt: 'Simple, research-backed routines to help children use technology purposefully at home.' },
            { id: 'p6', type: 'blog', cat: 'Student Life', title: 'Inside the Robotics Club: From LEGO to Global Stage', img: 'coding', author: 'T016', date: rel(-11), read: 4, tags: ['Robotics', 'Clubs'], excerpt: 'How a group of Grade 8 students built an award-winning autonomous robot in 12 weeks.' },
            { id: 'p7', type: 'blog', cat: 'Education', title: 'Why Inquiry-Based Learning Builds Better Thinkers', img: 'kidsClass', author: 'T008', date: rel(-15), read: 5, tags: ['Pedagogy', 'Learning'], excerpt: 'Moving from "what" to "why": how our classrooms turn questions into deep understanding.' },
            { id: 'p8', type: 'blog', cat: 'Technology', title: 'Getting Started with Python: A Guide for Young Coders', img: 'laptopStudents', author: 'T004', date: rel(-19), read: 7, tags: ['Coding', 'Python', 'Technology'], excerpt: 'A friendly roadmap for students in Grades 6–10 taking their first steps in programming.' },
            { id: 'p9', type: 'blog', cat: 'Activities', title: 'Eco Club Plants 5,000 Trees Across Hyderabad', img: 'eco', author: 'T012', date: rel(-24), read: 3, tags: ['Sustainability', 'Community'], excerpt: 'Our students partnered with GHMC to create three new urban forests this monsoon.' },
            { id: 'p10', type: 'news', cat: 'Achievements', title: 'Grade 12 Students Achieve 100% Board Results', img: 'studyGroup', author: 'T005', date: rel(-40), read: 3, tags: ['Results', 'CBSE'], excerpt: '42 students scored above 95%, with a school average of 89.6% — our best ever.' },
            { id: 'p11', type: 'news', cat: 'School News', title: 'Parent–Teacher Meeting Schedule for Term 1', img: 'teacherKids', author: 'T001', date: rel(-1), read: 2, tags: ['Parents', 'PTM'], excerpt: 'Slot booking is now open in the parent portal for the Term 1 PTM.' },
            { id: 'p12', type: 'blog', cat: 'Parent Resources', title: 'How to Support Your Child Through Exam Stress', img: 'reading', author: 'T015', date: rel(-9), read: 6, tags: ['Wellbeing', 'Exams', 'Parenting'], excerpt: 'Our counselling team shares warning signs, conversation starters and calming routines.' }
        ],
        partners: [
            { icon: 'fa-certificate', name: 'CBSE Affiliated' }, { icon: 'fa-globe', name: 'Cambridge Partner' }, { icon: 'fa-leaf', name: 'Green School Platinum' },
            { icon: 'fa-robot', name: 'FIRST LEGO League' }, { icon: 'fa-microscope', name: 'Atal Tinkering Lab' }, { icon: 'fa-shield-halved', name: 'ISO 9001:2015' },
            { icon: 'fa-language', name: 'Alliance Française' }, { icon: 'fa-award', name: 'British Council ISA' }
        ],
        leadership: [
            { name: 'Dr. Meera Krishnan', role: 'Principal', photo: 'w6' },
            { name: 'Mr. Anand Rao', role: 'Chairman, Board of Trustees', photo: 'm6' },
            { name: 'Ms. Deepika Shah', role: 'Vice Principal – Academics', photo: 'w9' },
            { name: 'Mr. Suresh Iyer', role: 'Director of Administration', photo: 'm8' }
        ]
    };

    /* ------------------------------------------------------------------ */
    /* Seed generator (LocalStorage records)                               */
    /* ------------------------------------------------------------------ */
    function seed() {
        const rnd = U.seeded(2026);
        const now = Date.now();
        const H = 3600e3, D = 864e5;

        /* ---- Users (login accounts) ---- */
        const users = [
            { id: 'U-ADM-01', role: 'admin', name: 'Suresh Iyer', email: 'admin@educare.edu', password: 'admin123', title: 'Director of Administration', photo: 'm8', phone: '+91 98480 10001' },
            { id: 'U-TCH-01', role: 'teacher', teacherId: 'T001', name: 'Priya Menon', email: 'priya.menon@educare.edu', password: 'teacher123', title: 'HOD – Mathematics', photo: 'w1', phone: '+91 98480 11001' },
            { id: 'U-STU-01', role: 'student', studentId: 'STU2026001', name: 'Aarav Sharma', email: 'aarav.sharma@educare.edu', password: 'student123', title: 'Grade 10 – A', photo: null, phone: '+91 98480 20001' },
            { id: 'U-PAR-01', role: 'parent', parentId: 'P001', name: 'Rajesh Sharma', email: 'rajesh.sharma@gmail.com', password: 'parent123', title: 'Parent', photo: 'm8', phone: '+91 98480 30001', children: ['STU2026001', 'STU2026050'] }
        ];

        /* ---- Students ---- */
        const firsts = ['Aarav', 'Diya', 'Vihaan', 'Isha', 'Arjun', 'Saanvi', 'Reyansh', 'Myra', 'Kabir', 'Anika', 'Aditya', 'Kiara', 'Rohan', 'Meera', 'Ishaan', 'Tara', 'Krish', 'Riya', 'Dhruv', 'Aisha', 'Aryan', 'Navya', 'Sai', 'Pari', 'Atharv', 'Zara', 'Veer', 'Kavya', 'Neil', 'Siya', 'Yash', 'Avni', 'Laksh', 'Nysa', 'Om', 'Prisha', 'Rudra', 'Sara', 'Shaurya', 'Tanvi', 'Ayaan', 'Ira', 'Dev', 'Mahira', 'Arnav', 'Anvi', 'Parth', 'Jiya', 'Vivaan', 'Ananya'];
        const lasts = ['Patel', 'Reddy', 'Iyer', 'Nair', 'Gupta', 'Kapoor', 'Mehta', 'Rao', 'Singh', 'Khan', 'Das', 'Joshi', 'Menon', 'Bose', 'Pillai', 'Verma', 'Chopra', 'Malhotra', 'Agarwal', 'Kulkarni'];
        const fathers = ['Rajesh', 'Suresh', 'Amit', 'Vijay', 'Kiran', 'Sanjay', 'Ravi', 'Manoj', 'Anil', 'Prakash', 'Imran', 'Deepak', 'Naveen', 'Srinivas'];
        const areas = ['KPHB Colony', 'Kondapur', 'Madhapur', 'Jubilee Hills', 'Manikonda', 'Miyapur', 'Banjara Hills', 'Tolichowki', 'Nallagandla', 'Hitech City'];
        const ranges = [['10-A', 0, 13], ['10-B', 14, 23], ['9-A', 24, 33], ['9-B', 34, 41], ['6-B', 42, 49]];
        const classOf = (i) => ranges.find(([, a, b]) => i >= a && i <= b)[0];
        const students = firsts.map((f, i) => {
            const last = (i === 0 || i === 49) ? 'Sharma' : lasts[(i * 7 + 3) % lasts.length];
            const cls = classOf(i);
            const grade = parseInt(cls, 10);
            const father = (i === 0 || i === 49) ? 'Rajesh' : fathers[i % fathers.length];
            const idx = ranges.find(([c]) => c === cls)[1];
            return {
                id: 'STU2026' + String(i + 1).padStart(3, '0'), name: `${f} ${last}`, class: cls, roll: i - idx + 1,
                gender: i % 2 === 0 ? 'Male' : 'Female', dob: `${2026 - grade - 6}-${U.pad((i % 12) + 1)}-${U.pad((i % 27) + 1)}`,
                parentName: `${father} ${last}`, parentPhone: `+91 98${String(4800000 + i * 3571).slice(0, 3)} ${String(10000 + i * 731).slice(0, 5)}`,
                email: `${f.toLowerCase()}.${last.toLowerCase()}@educare.edu`, area: areas[i % areas.length], busId: `BUS-0${(i % 6) + 1}`,
                attendance: +(88 + rnd() * 11).toFixed(1), gpa: +(7.2 + rnd() * 2.7).toFixed(1),
                feeStatus: ['Paid', 'Paid', 'Paid', 'Pending', 'Paid', 'Overdue', 'Paid'][i % 7], bloodGroup: ['O+', 'A+', 'B+', 'AB+', 'O-'][i % 5],
                admissionYear: 2026 - (i % 8), status: 'Active', house: ['Ganga', 'Yamuna', 'Kaveri', 'Godavari'][i % 4]
            };
        });
        const aarav = students[0];
        Object.assign(aarav, { dob: '2011-03-14', area: 'KPHB Colony', busId: 'BUS-01', attendance: 94.2, gpa: 9.1, feeStatus: 'Pending', house: 'Kaveri', bloodGroup: 'B+', admissionYear: 2019 });
        Object.assign(students[49], { dob: '2015-07-22', area: 'KPHB Colony', busId: 'BUS-01', attendance: 96.8, gpa: 9.4, feeStatus: 'Paid', house: 'Kaveri', bloodGroup: 'B+', admissionYear: 2021 });

        const parents = [
            { id: 'P001', name: 'Rajesh Sharma', email: 'rajesh.sharma@gmail.com', phone: '+91 98480 30001', occupation: 'Software Architect, Microsoft', children: ['STU2026001', 'STU2026050'], address: 'Flat 1204, Lodha Meridian, KPHB Colony, Hyderabad' },
            ...students.slice(1, 49).map((s, i) => ({ id: 'P' + String(i + 2).padStart(3, '0'), name: s.parentName, email: `${s.parentName.toLowerCase().replace(/ /g, '.')}@gmail.com`, phone: s.parentPhone, occupation: ['Doctor', 'Engineer', 'Business Owner', 'Banker', 'Architect', 'Professor', 'Consultant'][i % 7], children: [s.id], address: `${s.area}, Hyderabad` }))
        ];

        /* ---- Timetables ---- */
        const timetable = {};
        CLASSES.forEach((c, ci) => {
            const subjects = CLASS_SUBJECTS[c.track];
            const others = subjects.filter(([s]) => s !== 'Mathematics');
            const week = {};
            WEEKDAYS.forEach((day, d) => {
                const slots = [];
                const mathSlot = d === 5 ? [0, 1, 2, 3][ci % 4] : [0, 1, 2, 3, 5, 6][(d + ci) % 6];
                let k = d * 7 + ci * 3;
                TIMES.forEach((time, s) => {
                    if (s === 4) { slots.push({ time, type: 'break', subject: 'Lunch Break' }); return; }
                    if (d === 5 && s > 4) { slots.push({ time, type: 'activity', subject: 'Clubs & Activities', teacher: null, room: 'Activity Centre' }); return; }
                    const [subject, teacher] = s === mathSlot ? subjects[0] : others[(k++) % others.length];
                    slots.push({ time, subject, teacher, room: ROOMS[subject] || c.room });
                });
                week[day] = slots;
            });
            timetable[c.id] = week;
        });

        /* ---- Attendance (per-student daily records) ---- */
        const HOLIDAYS = { [rel(-46)]: 'Independence Day', [rel(-33)]: 'Raksha Bandhan', [rel(-16)]: 'Ganesh Chaturthi', [rel(2)]: 'Gandhi Jayanti' };
        const attendance = {};
        const startOffset = -112;
        students.forEach((s, si) => {
            const recs = {};
            const r = U.seeded(100 + si);
            for (let o = startOffset; o <= -1; o++) {
                const d = U.addDays(U.today(), o);
                const iso = U.toISO(d);
                if (d.getDay() === 0) continue;
                if (HOLIDAYS[iso]) { recs[iso] = 'H'; continue; }
                if (d.getDay() === 6 && Math.ceil(d.getDate() / 7) === 2) { recs[iso] = 'H'; continue; }
                const x = r();
                recs[iso] = x < (si === 0 ? 0.045 : 0.05) ? 'A' : x < (si === 0 ? 0.085 : 0.09) ? 'L' : 'P';
            }
            attendance[s.id] = recs;
        });

        /* Class attendance log (teacher-marked sessions) */
        const attendanceLog = [];
        CLASSES.forEach((c) => {
            for (let o = -21; o <= -1; o++) {
                const d = U.addDays(U.today(), o);
                const iso = U.toISO(d);
                if (d.getDay() === 0 || HOLIDAYS[iso]) continue;
                const records = {};
                students.filter((s) => s.class === c.id).forEach((s) => { records[s.id] = attendance[s.id][iso] === 'H' ? 'P' : (attendance[s.id][iso] || 'P'); });
                attendanceLog.push({ id: `${c.id}|${iso}`, class: c.id, date: iso, records, markedBy: c.classTeacher, time: '08:10' });
            }
        });

        /* ---- Homework ---- */
        const hw = (id, cls, subject, teacher, title, description, assigned, due, subs = {}) => ({ id, class: cls, subject, teacher, title, description, assigned: rel(assigned), due: rel(due), submissions: subs, attachments: [] });
        const sub = (d, note, grade, feedback) => ({ date: rel(d), note, file: note ? `${note.split(' ')[0].toLowerCase()}_submission.pdf` : 'submission.pdf', grade: grade || null, feedback: feedback || null });
        const homework = [
            hw('HW-101', '10-A', 'Mathematics', 'T001', 'Quadratic Equations — Exercise 4.3', 'Solve questions 1–12 from NCERT Exercise 4.3. Show the discriminant for each equation and state the nature of roots. Q10–12 must use the quadratic formula.', -3, 1),
            hw('HW-102', '10-A', 'Physics', 'T002', 'Light: Reflection & Refraction Worksheet', 'Complete the ray-diagram worksheet (15 questions). Use a sharp pencil and ruler; label focal points and centres of curvature clearly.', -5, -1, { STU2026001: sub(-2, 'Ray diagrams completed') }),
            hw('HW-103', '10-A', 'English', 'T005', 'Essay: The Role of Technology in Education', 'Write a 500-word argumentative essay. Include an introduction, three supporting arguments with evidence, a counter-argument and a conclusion.', -8, -3, { STU2026001: sub(-4, 'Essay final draft', 'A', 'Excellent structure and persuasive arguments. Work on varying sentence length in the conclusion.') }),
            hw('HW-104', '10-A', 'Chemistry', 'T003', 'Balancing Chemical Equations', 'Balance the 20 equations on page 14 of the practice booklet and classify each reaction type (combination, decomposition, displacement, redox).', -4, -1),
            hw('HW-105', '10-A', 'Computer Science', 'T004', 'Python: Loops Practice Set', 'Write programs for the 8 problems shared on the class drive (patterns, prime numbers, Fibonacci). Submit a single .py file with comments.', -1, 3),
            hw('HW-106', '10-A', 'Biology', 'T008', 'Diagram: Human Digestive System', 'Draw and label the human digestive system on an A4 sheet. Add a short note on the role of enzymes at each stage.', -2, 2),
            hw('HW-107', '10-A', 'Social Studies', 'T006', 'Map Work: Resources & Development', 'Mark the major soil types and the distribution of iron-ore and coal mines on the outline map of India.', -10, -5, { STU2026001: sub(-6, 'Map scanned', 'B+', 'Neat work. Two coal fields were misplaced — see corrections in red.') }),
            hw('HW-108', '10-A', 'French', 'T007', 'Vocabulaire : Les Métiers', 'Learn the 30 profession words and write 10 sentences describing what each person does, using the present tense.', -2, 4),
            hw('HW-201', '6-B', 'Mathematics', 'T014', 'Fractions & Decimals Worksheet', 'Complete worksheet 3B — converting fractions to decimals and word problems (Q1–15).', -2, 1),
            hw('HW-202', '6-B', 'Science', 'T008', 'Plant Life Cycle Chart', 'Create a colourful chart showing the life cycle of a flowering plant with labelled stages.', -7, -2, { STU2026050: sub(-3, 'Chart photo', 'A+', 'Beautiful, well-labelled chart! Great effort, Ananya.') }),
            hw('HW-203', '6-B', 'English', 'T015', 'Reading Log: Chapter 5', 'Read Chapter 5 of "The Secret Garden" and fill the reading log (summary, new words, favourite line).', -1, 2),
            hw('HW-204', '6-B', 'Hindi', 'T013', 'कविता पाठ — Poem Recitation Prep', 'Memorise the poem "पुष्प की अभिलाषा" and write its meaning in your own words.', -4, -1, { STU2026050: sub(-1, 'Meaning written') })
        ];

        /* ---- Assignments (projects) ---- */
        const asg = (id, cls, subject, teacher, title, description, max, assigned, due, subs = {}) => ({ id, class: cls, subject, teacher, title, description, maxMarks: max, assigned: rel(assigned), due: rel(due), submissions: subs, attachments: ['Assignment_Brief.pdf', 'Rubric.pdf'] });
        const asub = (d, marks, feedback) => ({ date: rel(d), file: 'project_submission.zip', note: 'Submitted via portal', marks, feedback, grade: marks != null ? 'graded' : null });
        const assignments = [
            asg('AS-301', '10-A', 'Computer Science', 'T004', 'Mini Project: Library Management in Python', 'Build a console-based library system with add/search/issue/return features using lists and dictionaries. Include a README and sample run.', 50, -12, 6),
            asg('AS-302', '10-A', 'Physics', 'T002', 'Lab Report: Verification of Ohm\'s Law', 'Submit your formal lab report with aim, apparatus, circuit diagram, observation table, V–I graph, result and precautions.', 25, -14, -2, { STU2026001: asub(-3, 22, 'Accurate graph and good precautions section. Include error analysis next time.') }),
            asg('AS-303', '10-A', 'Social Studies', 'T006', 'Research: Sustainable Development Goals', 'Choose one SDG, research India\'s progress and propose three school-level actions. 1,200 words with citations.', 40, -4, 10),
            asg('AS-304', '10-A', 'Mathematics', 'T001', 'Statistics Survey Project', 'Conduct a survey of 30 people, organise data into grouped frequency tables and calculate mean, median and mode. Present with graphs.', 30, -20, -6, { STU2026001: asub(-7, 27, 'Excellent data presentation. Median calculation for the grouped data is spot on.') }),
            asg('AS-305', '10-A', 'Biology', 'T008', 'Model: DNA Double Helix', 'Build a 3D model of the DNA double helix using recyclable materials and prepare a 2-minute explanation.', 30, -3, 14),
            asg('AS-306', '10-A', 'English', 'T005', 'Book Review: To Kill a Mockingbird', 'Write a critical review (800 words) discussing themes of justice and empathy, with at least four textual references.', 20, -10, -1, { STU2026001: asub(-1, null, null) }),
            asg('AS-401', '6-B', 'Science', 'T008', 'Science Model: The Solar System', 'Create a scaled model of the solar system and a fact card for each planet.', 30, -5, 8)
        ];

        /* ---- Exams & results ---- */
        const seniorSubjects = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Computer Science', 'Social Studies', 'French'];
        const middleSubjects = ['Mathematics', 'Science', 'English', 'Social Studies', 'Hindi', 'Computer Science'];
        const tOf = (cls, subject) => (CLASS_SUBJECTS[cls === '6-B' ? 'middle' : 'senior'].find(([s]) => s === subject) || [])[1];
        const exams = [];
        let eOff = 6;
        seniorSubjects.forEach((s, i) => {
            if (U.addDays(U.today(), eOff).getDay() === 0) eOff++;
            ['10-A', '10-B'].forEach((cls) => exams.push({ id: `EX-HY-${cls}-${i}`, name: 'Half-Yearly Examination', term: 'Term 1', class: cls, subject: s, date: rel(eOff), start: '09:30', end: '12:30', room: cls === '10-A' ? 'Exam Hall A' : 'Exam Hall B', maxMarks: 100, teacher: tOf(cls, s) }));
            eOff++;
        });
        let mOff = 7;
        middleSubjects.forEach((s, i) => {
            if (U.addDays(U.today(), mOff).getDay() === 0) mOff++;
            exams.push({ id: `EX-HY-6B-${i}`, name: 'Half-Yearly Examination', term: 'Term 1', class: '6-B', subject: s, date: rel(mOff), start: '09:30', end: '11:30', room: 'Room 012', maxMarks: 80, teacher: tOf('6-B', s) });
            mOff++;
        });
        exams.push({ id: 'EX-UT2-10A-M', name: 'Unit Test 2', term: 'Term 1', class: '10-A', subject: 'Mathematics', date: rel(3), start: '11:00', end: '12:00', room: 'Room 204', maxMarks: 40, teacher: 'T001' });
        exams.push({ id: 'EX-UT2-10B-M', name: 'Unit Test 2', term: 'Term 1', class: '10-B', subject: 'Mathematics', date: rel(4), start: '11:00', end: '12:00', room: 'Room 205', maxMarks: 40, teacher: 'T001' });

        const gradeOf = (p) => p >= 91 ? 'A1' : p >= 81 ? 'A2' : p >= 71 ? 'B1' : p >= 61 ? 'B2' : p >= 51 ? 'C1' : p >= 41 ? 'C2' : p >= 33 ? 'D' : 'E';
        const remarksFor = (p) => p >= 91 ? 'Outstanding performance — keep it up!' : p >= 81 ? 'Very good understanding of concepts.' : p >= 71 ? 'Good work; revise weaker topics.' : p >= 61 ? 'Satisfactory — needs more practice.' : 'Needs improvement; please meet the teacher.';
        const results = [];
        const examSeries = [
            { exam: 'Term 1 (2025–26)', date: rel(-330), boost: -6 },
            { exam: 'Term 2 (2025–26)', date: rel(-190), boost: -3 },
            { exam: 'Unit Test 1', date: rel(-72), boost: -1 },
            { exam: 'Quarterly Examination', date: rel(-26), boost: 0 }
        ];
        const basePerf = { Mathematics: 95, Physics: 88, Chemistry: 84, Biology: 86, English: 91, 'Computer Science': 97, 'Social Studies': 82, French: 89, Science: 93, Hindi: 88 };
        const pushResult = (student, subjects, cls, ex, base, jitter, r) => {
            subjects.forEach((subj) => {
                const pct = U.clamp(Math.round((basePerf[subj] || 85) + base + ex.boost + (r() - .5) * jitter), 38, 100);
                results.push({ id: `R-${student.id}-${U.slug(ex.exam)}-${U.slug(subj)}`, studentId: student.id, class: cls, exam: ex.exam, date: ex.date, subject: subj, marks: pct, max: 100, grade: gradeOf(pct), remarks: remarksFor(pct), teacher: tOf(cls, subj) });
            });
        };
        const rr = U.seeded(77);
        examSeries.forEach((ex) => pushResult(aarav, seniorSubjects, '10-A', ex, 0, 6, rr));
        examSeries.forEach((ex) => pushResult(students[49], middleSubjects, '6-B', ex, 1, 5, rr));
        students.filter((s) => ['10-A', '10-B', '9-A', '9-B'].includes(s.class) && s.id !== aarav.id).forEach((s, i) => {
            pushResult(s, s.class.startsWith('10') ? seniorSubjects : ['Mathematics', 'English', 'Physics', 'Chemistry'], s.class, examSeries[3], -8 - (i % 5) * 3, 14, rr);
        });

        /* ---- Fees ---- */
        const feeItem = (category, amount, paid, due) => ({ category, amount, paid, due: rel(due) });
        const fees = {
            STU2026001: {
                year: '2026–27',
                items: [feeItem('Tuition Fee', 120000, 80000, 3), feeItem('Transport Fee', 24000, 24000, -60), feeItem('Library Fee', 3000, 3000, -150), feeItem('Laboratory Fee', 6000, 0, 3), feeItem('Activity Fee', 8000, 8000, -150), feeItem('Examination Fee', 4500, 0, -2)],
                payments: [
                    { id: 'RCPT-2026-0412', date: rel(-172), amount: 40000, method: 'UPI', ref: 'UPI/417263591', items: 'Tuition Fee (Instalment 1)' },
                    { id: 'RCPT-2026-0413', date: rel(-172), amount: 11000, method: 'UPI', ref: 'UPI/417263592', items: 'Library Fee, Activity Fee' },
                    { id: 'RCPT-2026-1188', date: rel(-88), amount: 40000, method: 'Net Banking', ref: 'HDFC/88213470', items: 'Tuition Fee (Instalment 2)' },
                    { id: 'RCPT-2026-1189', date: rel(-60), amount: 24000, method: 'Credit Card', ref: 'VISA/****4821', items: 'Transport Fee (Annual)' }
                ]
            },
            STU2026050: {
                year: '2026–27',
                items: [feeItem('Tuition Fee', 110000, 110000, -150), feeItem('Transport Fee', 24000, 24000, -150), feeItem('Library Fee', 2500, 2500, -150), feeItem('Laboratory Fee', 4000, 4000, -150), feeItem('Activity Fee', 8000, 8000, -150), feeItem('Examination Fee', 3500, 0, 12)],
                payments: [{ id: 'RCPT-2026-0417', date: rel(-170), amount: 148500, method: 'Net Banking', ref: 'ICICI/55120984', items: 'Annual Fees (3% early-payment discount applied)' }]
            }
        };

        /* ---- Events ---- */
        const ev = (o) => Object.assign({ registrations: [], capacity: 300, organizer: 'EDUCARE Events Committee' }, o);
        const events = [
            ev({ id: 'EV-01', title: 'Annual Science & Innovation Fair 2026', category: 'Competitions', date: rel(12), start: '09:00', end: '16:00', location: 'Main Auditorium & Science Block', img: 'assets/images/events/science-fair.webp', desc: 'Over 220 student projects in robotics, renewable energy, health-tech and space science, judged by scientists from IIT Hyderabad and ISRO. Parents and guests are welcome.', organizer: 'Department of Science', capacity: 600, registered: 412, featured: true,
                schedule: [['09:00', 'Inauguration & Keynote', 'Main Auditorium'], ['10:00', 'Project Exhibition Opens', 'Science Block – all floors'], ['12:30', 'Innovation Talks by Students', 'Seminar Hall'], ['14:00', 'Judging Round', 'Science Block'], ['15:30', 'Awards Ceremony', 'Main Auditorium']],
                speakers: [['Dr. K. Radhakrishnan', 'Scientist, ISRO', 'm6'], ['Prof. Anjali Rao', 'Dept. of Physics, IIT Hyderabad', 'w9'], ['Daniel Brooks', 'Head of Science, EDUCARE', 'm1']] }),
            ev({ id: 'EV-02', title: 'Inter-School Football Championship', category: 'Sports', date: rel(5), start: '08:00', end: '17:00', location: 'EDUCARE Sports Ground', img: 'assets/images/events/football-championship.webp', desc: 'Sixteen schools from across Hyderabad compete in U-14 and U-17 categories on our FIFA-standard turf. Come cheer for Team EDUCARE!', organizer: 'Department of Physical Education', capacity: 800, registered: 520,
                schedule: [['08:00', 'Opening Ceremony', 'Main Ground'], ['09:00', 'Group Stage Matches', 'Pitch 1 & 2'], ['13:00', 'Quarter Finals', 'Main Pitch'], ['16:00', 'Finals & Prize Distribution', 'Main Pitch']], speakers: [['Arjun Mehta', 'Director of Sports', 'm4']] }),
            ev({ id: 'EV-03', title: 'Parent–Teacher Meeting (Term 1)', category: 'Parent Meetings', date: rel(3), start: '09:00', end: '13:00', location: 'Respective Classrooms', img: 'assets/images/events/parent-teacher-meeting.webp', desc: 'Discuss your child\'s academic progress, Quarterly Examination results and wellbeing with class and subject teachers. Please book your slot in the parent portal.', organizer: 'Academic Office', capacity: 900, registered: 684,
                schedule: [['09:00', 'Grades 1 – 5', 'Primary Block'], ['10:30', 'Grades 6 – 8', 'Middle Block'], ['11:45', 'Grades 9 – 12', 'Senior Block']], speakers: [['Dr. Meera Krishnan', 'Principal', 'w6']] }),
            ev({ id: 'EV-04', title: 'Robotics & AI Workshop', category: 'Workshops', date: rel(9), start: '14:00', end: '17:00', location: 'Innovation Lab', img: 'assets/images/events/robotics-workshop.webp', desc: 'A hands-on workshop on building line-following robots and training simple machine-learning models. Open to Grades 6–10. Laptops provided.', organizer: 'Department of Computer Science', capacity: 60, registered: 51,
                schedule: [['14:00', 'Intro to Sensors & Microcontrollers', 'Innovation Lab'], ['15:00', 'Build a Line-Follower', 'Innovation Lab'], ['16:15', 'Teachable Machine Challenge', 'Computer Lab 2']], speakers: [['Karthik Rao', 'Robotics Instructor', 'm7'], ['Rohan Kapoor', 'HOD Computer Science', 'm2']] }),
            ev({ id: 'EV-05', title: 'Career Guidance Seminar — Grades 11 & 12', category: 'Seminars', date: rel(16), start: '11:00', end: '13:30', location: 'Conference Hall', img: 'assets/images/events/career-seminar.webp', desc: 'University admissions experts and alumni talk about careers in engineering, medicine, design, law and liberal arts, plus a session on SAT & CUET.', organizer: 'Career Counselling Cell', capacity: 250, registered: 188,
                schedule: [['11:00', 'Choosing the Right Stream', 'Conference Hall'], ['11:45', 'Alumni Panel', 'Conference Hall'], ['12:45', 'Q&A and 1:1 Counselling', 'Counselling Rooms']], speakers: [['Siddharth Varma', 'Product Manager, Google (Alumnus)', 'm2'], ['Dr. Nandini Iyer', 'Paediatrician, AIIMS (Alumna)', 'w5']] }),
            ev({ id: 'EV-06', title: 'Educational Trip to B.M. Birla Science Centre', category: 'School Trips', date: rel(24), start: '07:30', end: '15:00', location: 'B.M. Birla Science Centre, Hyderabad', img: 'assets/images/events/science-centre-trip.webp', desc: 'Grade 8 students visit the planetarium, dinosaurium and science museum, followed by a guided astronomy session.', organizer: 'Middle School Coordinators', capacity: 160, registered: 142,
                schedule: [['07:30', 'Departure from Campus', 'Bus Bay'], ['09:00', 'Planetarium Show', 'Birla Planetarium'], ['11:00', 'Science Museum Tour', 'Science Centre'], ['13:30', 'Return Journey', '—']], speakers: [] }),
            ev({ id: 'EV-07', title: 'Diwali Celebration & Cultural Evening', category: 'Celebrations', date: rel(38), start: '17:30', end: '20:30', location: 'Open Air Theatre', img: 'assets/images/events/diwali-celebration.webp', desc: 'An evening of lights, dance, music and a rangoli competition celebrating the festival of Diwali with the whole EDUCARE family.', organizer: 'Cultural Committee', capacity: 1500, registered: 740,
                schedule: [['17:30', 'Lamp Lighting', 'Main Courtyard'], ['18:00', 'Dance & Music Performances', 'Open Air Theatre'], ['19:30', 'Rangoli Awards & Dinner', 'Courtyard']], speakers: [] }),
            ev({ id: 'EV-08', title: 'Swaranjali — Annual Music Concert', category: 'Cultural', date: rel(45), start: '18:00', end: '20:30', location: 'Main Auditorium', img: 'assets/images/events/music-concert.webp', desc: 'Our orchestra, choir and bands present an evening of Indian classical, Western and fusion music.', organizer: 'Department of Music', capacity: 800, registered: 356,
                schedule: [['18:00', 'Junior Choir', 'Main Auditorium'], ['18:40', 'Indian Classical Ensemble', 'Main Auditorium'], ['19:30', 'Symphony Orchestra & Rock Band', 'Main Auditorium']], speakers: [['Rahul Deshpande', 'Music Director', 'm5']] }),
            ev({ id: 'EV-09', title: 'Mathematics Olympiad — Level 1', category: 'Academic', date: rel(19), start: '10:00', end: '12:00', location: 'Exam Halls A & B', img: 'assets/images/events/maths-olympiad.webp', desc: 'The school-level round of the International Mathematics Olympiad for Grades 3–10. Top scorers qualify for Level 2.', organizer: 'Department of Mathematics', capacity: 400, registered: 318,
                schedule: [['09:30', 'Reporting & Seating', 'Exam Halls'], ['10:00', 'Olympiad Paper', 'Exam Halls'], ['12:00', 'Paper Discussion', 'Room 204']], speakers: [['Priya Menon', 'HOD Mathematics', 'w1']] }),
            ev({ id: 'EV-10', title: 'Inter-House Athletics Meet', category: 'Sports', date: rel(-12), start: '07:30', end: '13:00', location: 'Athletics Track', img: 'assets/images/events/athletics-meet.webp', desc: 'Ganga, Yamuna, Kaveri and Godavari houses competed in 32 track and field events. Kaveri House lifted the trophy!', organizer: 'Department of Physical Education', capacity: 1000, registered: 960, schedule: [], speakers: [] }),
            ev({ id: 'EV-11', title: 'Teachers\' Day Tribute', category: 'Cultural', date: rel(-25), start: '10:00', end: '12:30', location: 'Main Auditorium', img: 'assets/images/events/teachers-day.webp', desc: 'Students organised a heartfelt tribute with performances, skits and a surprise video for our teachers.', organizer: 'Student Council', capacity: 800, registered: 780, schedule: [], speakers: [] }),
            ev({ id: 'EV-12', title: 'Independence Day Celebration', category: 'Celebrations', date: rel(-46), start: '08:00', end: '10:30', location: 'Main Ground', img: 'assets/images/events/independence-day.webp', desc: 'Flag hoisting, march past by NCC cadets and a patriotic cultural programme.', organizer: 'NCC & Cultural Committee', capacity: 3000, registered: 2800, schedule: [], speakers: [] })
        ];

        /* ---- Notices ---- */
        const notices = [
            { id: 'N-01', title: 'Half-Yearly Examination Schedule Released', category: 'Exam', priority: 'High', pinned: true, date: rel(-1), audience: 'all', author: 'Examination Cell', desc: `The Half-Yearly Examinations for Grades 6–12 begin on ${U.fmtDate(rel(6))}. Detailed date sheets are available in the Exams section of the student portal. Admit cards will be issued after clearance of dues.` },
            { id: 'N-02', title: 'Grade 10 Board Registration — Document Submission', category: 'Academic', priority: 'High', pinned: true, date: rel(-10), audience: 'parents', author: 'Academic Office', desc: 'Parents of Grade 10 students must verify spellings of names and dates of birth on the CBSE registration form and submit signed copies to the class teacher.' },
            { id: 'N-03', title: 'School Closed on 2 October — Gandhi Jayanti', category: 'Holiday', priority: 'Medium', pinned: false, date: rel(-2), audience: 'all', author: 'Principal\'s Office', desc: 'The school will remain closed on account of Gandhi Jayanti. Buses will not operate. Classes resume as per the regular timetable the next day.' },
            { id: 'N-04', title: 'Parent–Teacher Meeting This Saturday', category: 'Parent Meeting', priority: 'High', pinned: false, date: rel(-3), audience: 'parents', author: 'Academic Office', desc: `Term 1 PTM is scheduled on ${U.fmtDate(rel(3), { long: true })} from 9:00 AM to 1:00 PM. Please book your 10-minute slot through the parent portal.` },
            { id: 'N-05', title: 'Science Fair Registrations Open', category: 'Event', priority: 'Medium', pinned: false, date: rel(-4), audience: 'students', author: 'Department of Science', desc: 'Teams of up to 3 students can register their projects until next Friday. Mentors will be assigned by the science department.' },
            { id: 'N-06', title: 'Winter Uniform from 1 November', category: 'Academic', priority: 'Low', pinned: false, date: rel(-5), audience: 'all', author: 'Administration', desc: 'Students may switch to the winter uniform (blazer / navy sweater) from 1 November. The uniform store is open on weekdays 8:00 AM – 3:00 PM.' },
            { id: 'N-07', title: 'Dussehra Break: 19 – 21 October', category: 'Holiday', priority: 'Medium', pinned: false, date: rel(-7), audience: 'all', author: 'Principal\'s Office', desc: 'The school will remain closed for the Dussehra break. Holiday homework will be shared on the portal.' },
            { id: 'N-08', title: 'Heavy Rain Advisory — Early Dismissal at 1:00 PM', category: 'Emergency', priority: 'High', pinned: false, date: rel(-8), audience: 'all', author: 'Transport & Safety Office', desc: 'Due to the IMD orange alert, all students were dismissed at 1:00 PM. Buses departed on revised timings. Parents picking up children were requested to carry the pickup card.' },
            { id: 'N-09', title: 'Library Week: Read-a-thon Challenge', category: 'Event', priority: 'Low', pinned: false, date: rel(-9), audience: 'students', author: 'Library', desc: 'Read the most pages in 7 days and win exciting prizes! Log your reading in the Library section of the portal.' },
            { id: 'N-10', title: 'Annual Sports Day Rehearsal Timetable', category: 'Event', priority: 'Medium', pinned: false, date: rel(-12), audience: 'students', author: 'Department of Physical Education', desc: 'Rehearsals will be held during periods 7 and 8 on Tuesdays and Thursdays. Participants must carry their house T-shirts.' }
        ];

        /* ---- Messages (addressed by email) ---- */
        const msg = (id, from, to, subject, body, agoMs, read, attachments = []) => ({ id, from, to, subject, body, date: new Date(now - agoMs).toISOString(), read, attachments, starred: false });
        const messages = [
            msg('M-01', 'priya.menon@educare.edu', 'aarav.sharma@educare.edu', 'Feedback on Quadratic Equations test', 'Hi Aarav,\n\nGreat work on the class test — 38/40! Your method for completing the square was very clear.\n\nFor the Half-Yearly exam, please revise word problems on quadratic equations (Exercise 4.4). I have uploaded extra practice questions to the class drive.\n\nBest,\nMs. Priya Menon', 2 * H, false),
            msg('M-02', 'admin@educare.edu', 'aarav.sharma@educare.edu', 'Half-Yearly Examination — Admit Card', 'Dear Aarav,\n\nYour admit card for the Half-Yearly Examination is attached. Please carry a printed copy along with your school ID card on every exam day.\n\nRegards,\nExamination Cell', 26 * H, false, ['AdmitCard_STU2026001.pdf']),
            msg('M-03', 'aarav.sharma@educare.edu', 'priya.menon@educare.edu', 'Doubt in Exercise 4.3 — Question 7', 'Good evening Ma\'am,\n\nIn Q7 of Exercise 4.3, I am getting a negative discriminant but the answer key shows real roots. Could you please check my working (attached)?\n\nThank you,\nAarav', 20 * H, false, ['Q7_working.jpg']),
            msg('M-04', 'daniel.brooks@educare.edu', 'aarav.sharma@educare.edu', 'Physics Lab Report — Well done!', 'Hi Aarav,\n\nYour Ohm\'s Law lab report was one of the best in the class. I\'d like you to present your graph analysis in Friday\'s lab session.\n\nCheers,\nMr. Brooks', 3 * D, true),
            msg('M-05', 'priya.menon@educare.edu', 'rajesh.sharma@gmail.com', 'Aarav\'s progress in Mathematics', 'Dear Mr. Sharma,\n\nI\'m happy to share that Aarav has been consistently scoring above 90% in Mathematics this term. He is also a candidate for the Level 2 Math Olympiad.\n\nI look forward to meeting you at the PTM on Saturday.\n\nWarm regards,\nPriya Menon\nHOD – Mathematics', 5 * H, false),
            msg('M-06', 'admin@educare.edu', 'rajesh.sharma@gmail.com', 'Fee Reminder: Examination & Laboratory Fee', 'Dear Parent,\n\nThis is a gentle reminder that the Examination Fee (₹4,500) and Laboratory Fee (₹6,000) for Aarav Sharma (Grade 10-A) are pending. Admit cards will be released after clearance.\n\nYou can pay instantly through the Fees section of the parent portal.\n\nAccounts Office', 28 * H, false),
            msg('M-07', 'rajesh.sharma@gmail.com', 'priya.menon@educare.edu', 'Request for PTM slot', 'Dear Ms. Menon,\n\nCould we please have a 10:40 AM slot at the PTM? I would like to discuss Olympiad preparation for Aarav.\n\nThanks,\nRajesh Sharma', 22 * H, false),
            msg('M-08', 'admin@educare.edu', 'priya.menon@educare.edu', 'Half-Yearly Question Paper Submission', 'Dear Teachers,\n\nPlease submit the Half-Yearly question papers and marking schemes to the Examination Cell by Friday, 3:00 PM. Use the updated blueprint template.\n\nRegards,\nExamination Cell', 6 * H, false, ['QP_Blueprint_2026.docx']),
            msg('M-09', 'priya.menon@educare.edu', 'admin@educare.edu', 'Smart board repair — Room 204', 'Hello Suresh,\n\nThe interactive panel in Room 204 has been flickering since Monday. Could the IT team take a look before the exams?\n\nThanks,\nPriya', 3 * H, false),
            msg('M-10', 'sarah.thompson@educare.edu', 'admin@educare.edu', 'Library Week proposal', 'Hi Suresh,\n\nAttached is the proposal for Library Week, including an author visit and a read-a-thon. Budget estimate: ₹45,000.\n\nBest,\nSarah', 2 * D, true, ['LibraryWeek_Proposal.pdf']),
            msg('M-11', 'lakshmi.venkat@educare.edu', 'rajesh.sharma@gmail.com', 'Ananya\'s reading progress', 'Dear Mr. Sharma,\n\nAnanya has completed 14 books in our reading programme this term — the highest in her class! She is a delight to teach.\n\nRegards,\nLakshmi Venkat', 4 * D, true),
            msg('M-12', 'aarav.sharma@educare.edu', 'rohan.kapoor@educare.edu', 'Hackathon team registration', 'Hi Sir,\n\nOur team (Aarav, Kabir, Diya) would like to register for the EDUCARE Hackathon. Our idea is a bus-tracking app for parents.\n\nRegards,\nAarav', 2 * D, true)
        ];

        /* ---- Notifications ---- */
        const nt = (target, text, type, agoMs, link, read = false) => ({ id: U.uid('NT'), target, text, type, time: new Date(now - agoMs).toISOString(), read, link });
        const notifications = [
            nt('U-STU-01', 'Your Mathematics homework "Quadratic Equations — Exercise 4.3" is due tomorrow.', 'homework', 40 * 60e3, 'homework.html'),
            nt('U-STU-01', 'Science exam starts at 10:00 AM — Physics practical slot confirmed.', 'exam', 3 * H, 'exams.html'),
            nt('U-STU-01', 'New message from Ms. Priya Menon.', 'message', 2 * H, 'messages.html'),
            nt('U-STU-01', 'Your English essay was graded: A.', 'result', 26 * H, 'homework.html', true),
            nt('U-STU-01', 'Library book "Python Crash Course" is overdue. Please return it.', 'library', 30 * H, 'library-dashboard.html'),
            nt('role:parent', 'Parent–Teacher Meeting scheduled for Saturday. Book your slot now.', 'meeting', 5 * H, 'notices.html'),
            nt('role:parent', 'Fee payment is due in 3 days — Tuition Fee (Instalment 3).', 'fee', 8 * H, 'fees-dashboard.html'),
            nt('role:parent', 'Aarav was marked present today at 7:58 AM.', 'attendance', 9 * H, 'attendance.html'),
            nt('role:parent', 'Bus BUS-01 has departed from KPHB Colony.', 'bus', 10 * H, 'bus-tracking.html', true),
            nt('role:teacher', '6 new submissions for "Quadratic Equations — Exercise 4.3".', 'homework', 1 * H, 'homework.html'),
            nt('role:teacher', 'Half-Yearly question papers due Friday 3:00 PM.', 'exam', 6 * H, 'exams.html'),
            nt('role:teacher', 'New message from Rajesh Sharma (Parent).', 'message', 22 * H, 'messages.html'),
            nt('role:admin', '3 new admission applications received today.', 'admission', 50 * 60e3, 'admin-dashboard.html#admissions'),
            nt('role:admin', 'Fee collection crossed ₹4.2 Cr for this term.', 'fee', 4 * H, 'fees-dashboard.html'),
            nt('role:admin', 'Bus BUS-04 is running 12 minutes late on Route 4.', 'bus', 30 * 60e3, 'bus-tracking.html'),
            nt('all', 'New announcement from the school: Half-Yearly Examination schedule released.', 'notice', 20 * H, 'notices.html')
        ];

        /* ---- Library ---- */
        const B = (id, title, author, category, year, copies, color, rating, desc) => ({ id, title, author, category, year, copies, color, rating, isbn: `978-${String(8100000000 + id.slice(2) * 7919).slice(0, 10)}`, shelf: `${category.slice(0, 3).toUpperCase()}-${id.slice(2)}`, desc });
        const books = [
            B('BK001', 'To Kill a Mockingbird', 'Harper Lee', 'Fiction', 1960, 6, '#5B41B8', 4.8, 'A powerful story of racial injustice and moral growth in the American South.'),
            B('BK002', 'A Brief History of Time', 'Stephen Hawking', 'Science', 1988, 4, '#002522', 4.7, 'From the Big Bang to black holes — cosmology for curious minds.'),
            B('BK003', 'Wings of Fire', 'A.P.J. Abdul Kalam', 'Biography', 1999, 8, '#EA580C', 4.9, 'The inspiring autobiography of India\'s Missile Man and former President.'),
            B('BK004', 'The Diary of a Young Girl', 'Anne Frank', 'Biography', 1947, 5, '#B91C1C', 4.8, 'The wartime diary of a Jewish girl hiding in Amsterdam.'),
            B('BK005', 'Sapiens', 'Yuval Noah Harari', 'History', 2011, 3, '#CA8A04', 4.6, 'A brief history of humankind from the Stone Age to the present.'),
            B('BK006', 'The Alchemist', 'Paulo Coelho', 'Fiction', 1988, 6, '#E89A00', 4.5, 'A shepherd boy\'s journey in search of treasure and his personal legend.'),
            B('BK007', 'Harry Potter and the Philosopher\'s Stone', 'J.K. Rowling', 'Fiction', 1997, 10, '#991B1B', 4.9, 'The boy who lived begins his magical education at Hogwarts.'),
            B('BK008', 'Concepts of Physics Vol. 1', 'H.C. Verma', 'Science', 1992, 12, '#002522', 4.8, 'The classic physics text for senior secondary students.'),
            B('BK009', 'Mathematics for Class 10', 'R.D. Sharma', 'Mathematics', 2024, 15, '#013431', 4.6, 'Comprehensive practice for CBSE Class 10 Mathematics.'),
            B('BK010', 'The Selfish Gene', 'Richard Dawkins', 'Science', 1976, 3, '#0F6B61', 4.5, 'A gene-centred view of evolution that changed biology.'),
            B('BK011', 'Clean Code', 'Robert C. Martin', 'Technology', 2008, 3, '#0E7490', 4.7, 'A handbook of agile software craftsmanship.'),
            B('BK012', 'Python Crash Course', 'Eric Matthes', 'Technology', 2019, 6, '#0284C7', 4.8, 'A hands-on, project-based introduction to programming.'),
            B('BK013', 'The Discovery of India', 'Jawaharlal Nehru', 'History', 1946, 4, '#9A3412', 4.5, 'A sweeping view of Indian history, philosophy and culture.'),
            B('BK014', 'Oxford Advanced Learner\'s Dictionary', 'Oxford University Press', 'Reference', 2020, 10, '#013431', 4.9, 'The world\'s bestselling advanced learner\'s dictionary.'),
            B('BK015', 'Malgudi Days', 'R.K. Narayan', 'Fiction', 1943, 7, '#65A30D', 4.7, 'Timeless short stories set in the fictional town of Malgudi.'),
            B('BK016', 'The Story of My Experiments with Truth', 'M.K. Gandhi', 'Biography', 1927, 5, '#78716C', 4.6, 'The autobiography of Mahatma Gandhi.'),
            B('BK017', 'Cosmos', 'Carl Sagan', 'Science', 1980, 4, '#312E81', 4.8, 'A personal voyage through the universe and scientific history.'),
            B('BK018', 'The Man Who Knew Infinity', 'Robert Kanigel', 'Biography', 1991, 3, '#0F6B61', 4.7, 'The life of the genius mathematician Srinivasa Ramanujan.'),
            B('BK019', 'Charlotte\'s Web', 'E.B. White', 'Children', 1952, 8, '#DB2777', 4.8, 'The beloved tale of friendship between a pig and a spider.'),
            B('BK020', 'The Little Prince', 'Antoine de Saint-Exupéry', 'Children', 1943, 7, '#0891B2', 4.9, 'A poetic tale about love, loss and what truly matters.'),
            B('BK021', 'Atomic Habits', 'James Clear', 'Personal Growth', 2018, 4, '#3F5A61', 4.8, 'Tiny changes, remarkable results — a guide to building good habits.'),
            B('BK022', 'Organic Chemistry', 'Morrison & Boyd', 'Science', 1959, 5, '#047857', 4.4, 'A foundational text in organic chemistry.'),
            B('BK023', 'India After Gandhi', 'Ramachandra Guha', 'History', 2007, 3, '#A86F00', 4.7, 'The history of the world\'s largest democracy since 1947.'),
            B('BK024', 'The Hitchhiker\'s Guide to the Galaxy', 'Douglas Adams', 'Fiction', 1979, 4, '#159B78', 4.6, 'Don\'t panic! A comedic science-fiction classic.')
        ];
        const loan = (id, bookId, memberId, issued, due, returned = null) => ({ id, bookId, memberId, issued: rel(issued), due: rel(due), returned: returned == null ? null : rel(returned) });
        const loans = [
            loan('LN-01', 'BK002', 'STU2026001', -10, 4), loan('LN-02', 'BK012', 'STU2026001', -16, -2), loan('LN-03', 'BK003', 'STU2026001', -13, 1),
            loan('LN-04', 'BK006', 'STU2026001', -45, -31, -33), loan('LN-05', 'BK005', 'STU2026001', -70, -56, -58),
            loan('LN-06', 'BK019', 'STU2026050', -8, 6), loan('LN-07', 'BK020', 'STU2026050', -30, -16, -17),
            loan('LN-08', 'BK007', 'STU2026002', -5, 9), loan('LN-09', 'BK008', 'STU2026004', -12, 2), loan('LN-10', 'BK009', 'STU2026011', -20, -6),
            loan('LN-11', 'BK001', 'STU2026016', -3, 11), loan('LN-12', 'BK015', 'STU2026027', -9, 5), loan('LN-13', 'BK017', 'STU2026033', -15, -1),
            loan('LN-14', 'BK021', 'T001', -6, 24), loan('LN-15', 'BK011', 'T004', -11, 19)
        ];

        /* ---- Transport ---- */
        const S = (name, lat, lng, time) => ({ name, lat, lng, time });
        const school = { name: 'EDUCARE Campus', lat: SCHOOL.coords[0], lng: SCHOOL.coords[1], time: '07:55' };
        const buses = [
            { id: 'BUS-01', number: 'TS 07 UA 4521', route: 'Route 1 · Kukatpally – KPHB – Hitech City', driver: 'Ramesh Kumar', driverPhone: '+91 98491 40101', attendant: 'Lalitha M.', capacity: 48, students: 44, departure: '06:55', arrival: '07:50', progress: .38, delayed: false, color: '#013431', stops: [S('Kukatpally Metro', 17.4935, 78.3995, '06:55'), S('KPHB Colony', 17.4840, 78.3905, '07:08'), S('JNTU Junction', 17.4935, 78.3915, '07:15'), S('Hitech City MMTS', 17.4550, 78.3760, '07:32'), school] },
            { id: 'BUS-02', number: 'TS 07 UB 1187', route: 'Route 2 · Jubilee Hills – Madhapur – Kondapur', driver: 'Mohammed Saleem', driverPhone: '+91 98491 40102', attendant: 'Sunitha R.', capacity: 48, students: 41, departure: '06:50', arrival: '07:45', progress: .62, delayed: false, color: '#159B78', stops: [S('Jubilee Hills Check Post', 17.4326, 78.4071, '06:50'), S('Madhapur Police Station', 17.4483, 78.3915, '07:05'), S('Kondapur Main Road', 17.4600, 78.3640, '07:22'), school] },
            { id: 'BUS-03', number: 'TS 07 UC 9043', route: 'Route 3 · Manikonda – Narsingi – Financial District', driver: 'Venkatesh Goud', driverPhone: '+91 98491 40103', attendant: 'Padma K.', capacity: 40, students: 36, departure: '07:00', arrival: '07:48', progress: 1, delayed: false, color: '#F59E0B', stops: [S('Manikonda Panchavati', 17.4050, 78.3860, '07:00'), S('Narsingi Circle', 17.3900, 78.3570, '07:14'), S('Financial District', 17.4150, 78.3430, '07:30'), school] },
            { id: 'BUS-04', number: 'TS 07 UD 3321', route: 'Route 4 · Miyapur – Chandanagar – Nallagandla', driver: 'Srinivas Reddy', driverPhone: '+91 98491 40104', attendant: 'Rani P.', capacity: 48, students: 46, departure: '06:45', arrival: '07:50', progress: .18, delayed: true, color: '#E74C3C', stops: [S('Miyapur X Roads', 17.4960, 78.3570, '06:45'), S('Chandanagar', 17.4970, 78.3300, '07:00'), S('Nallagandla', 17.4700, 78.3100, '07:20'), school] },
            { id: 'BUS-05', number: 'TS 07 UE 7765', route: 'Route 5 · Banjara Hills – Film Nagar – Raidurg', driver: 'Joseph Thomas', driverPhone: '+91 98491 40105', attendant: 'Mary J.', capacity: 40, students: 33, departure: '07:10', arrival: '07:55', progress: 0, delayed: false, color: '#7356D8', stops: [S('Banjara Hills Rd No. 12', 17.4150, 78.4380, '07:10'), S('Film Nagar', 17.4140, 78.4090, '07:22'), S('Raidurg Metro', 17.4290, 78.3790, '07:36'), school] },
            { id: 'BUS-06', number: 'TS 07 UF 2290', route: 'Route 6 · Tolichowki – Khajaguda', driver: 'Anjaiah B.', driverPhone: '+91 98491 40106', attendant: 'Kavitha S.', capacity: 40, students: 38, departure: '07:00', arrival: '07:52', progress: .84, delayed: false, color: '#EC4899', stops: [S('Tolichowki Flyover', 17.3990, 78.4150, '07:00'), S('Shaikpet', 17.4040, 78.3920, '07:12'), S('Khajaguda Lake', 17.4160, 78.3700, '07:28'), school] }
        ];

        /* ---- Admissions ---- */
        const app = (id, name, grade, gender, dob, prev, father, mother, email, phone, city, status, agoDays) => ({
            id, submitted: new Date(now - agoDays * D).toISOString(), status,
            student: { name, dob, gender, grade, previousSchool: prev },
            parent: { father, mother, email, phone, occupation: 'Professional' },
            address: { country: 'India', state: 'Telangana', city, address: `${city}, Hyderabad`, postal: '5000' + (30 + (agoDays % 60)) },
            documents: { birth: 'birth_certificate.pdf', previous: prev ? 'report_card.pdf' : '', photo: 'photo.jpg' }
        });
        const admissions = [
            app('EDU-2026-1042', 'Ishita Varma', 'Grade 6', 'Female', '2015-04-12', 'Delhi Public School, Nacharam', 'Anil Varma', 'Sneha Varma', 'anil.varma@gmail.com', '+91 98490 11223', 'Kondapur', 'New', 0.1),
            app('EDU-2026-1041', 'Aryan Khanna', 'Grade 1', 'Male', '2020-08-02', 'Little Millennium, Madhapur', 'Rohit Khanna', 'Pooja Khanna', 'rohit.k@outlook.com', '+91 99590 22134', 'Madhapur', 'New', 0.4),
            app('EDU-2026-1040', 'Fatima Zehra', 'Grade 11', 'Female', '2010-01-19', 'St. Ann\'s High School', 'Imran Ali', 'Zehra Begum', 'imran.ali@gmail.com', '+91 90003 45671', 'Tolichowki', 'New', 0.8),
            app('EDU-2026-1037', 'Samarth Joshi', 'Grade 3', 'Male', '2018-06-30', 'Oakridge International', 'Nikhil Joshi', 'Aparna Joshi', 'nikhil.joshi@gmail.com', '+91 98855 20981', 'Gachibowli', 'Under Review', 2),
            app('EDU-2026-1033', 'Myra Kapoor', 'Nursery', 'Female', '2023-02-11', '', 'Karan Kapoor', 'Ritu Kapoor', 'karan.kapoor@gmail.com', '+91 97010 55555', 'Jubilee Hills', 'Document Verification', 4),
            app('EDU-2026-1029', 'Vedant Rao', 'Grade 9', 'Male', '2012-11-05', 'Chirec International', 'Srikanth Rao', 'Latha Rao', 'srikanth.rao@yahoo.com', '+91 98480 77612', 'Manikonda', 'Assessment Scheduled', 6),
            app('EDU-2026-1021', 'Aadhya Nair', 'Grade 6', 'Female', '2015-09-21', 'Meridian School', 'Prakash Nair', 'Divya Nair', 'prakash.nair@gmail.com', '+91 98666 10029', 'Miyapur', 'Approved', 9),
            app('EDU-2026-1015', 'Rehan Siddiqui', 'Grade 4', 'Male', '2017-03-17', 'Kendriya Vidyalaya', 'Faisal Siddiqui', 'Nazia Siddiqui', 'faisal.s@gmail.com', '+91 90102 88765', 'Tolichowki', 'Rejected', 12)
        ];

        /* ---- Teacher-specific ---- */
        const lessonPlans = [
            { id: 'LP-01', teacher: 'T001', class: '10-A', subject: 'Mathematics', week: 'Week 14', topic: 'Quadratic Equations — Nature of Roots', objectives: 'Compute discriminant; classify roots; solve word problems', resources: 'NCERT Ch. 4, GeoGebra demo', status: 'Completed' },
            { id: 'LP-02', teacher: 'T001', class: '10-A', subject: 'Mathematics', week: 'Week 15', topic: 'Arithmetic Progressions — nth Term', objectives: 'Derive nth-term formula; apply to real-life patterns', resources: 'NCERT Ch. 5, worksheet AP-1', status: 'In Progress' },
            { id: 'LP-03', teacher: 'T001', class: '10-B', subject: 'Mathematics', week: 'Week 15', topic: 'Quadratic Equations — Word Problems', objectives: 'Model situations using quadratics', resources: 'Exercise 4.4, group activity', status: 'In Progress' },
            { id: 'LP-04', teacher: 'T001', class: '9-A', subject: 'Mathematics', week: 'Week 15', topic: 'Polynomials — Remainder Theorem', objectives: 'State and apply remainder & factor theorems', resources: 'NCERT Ch. 2', status: 'Planned' },
            { id: 'LP-05', teacher: 'T001', class: '9-B', subject: 'Mathematics', week: 'Week 16', topic: 'Coordinate Geometry — Cartesian Plane', objectives: 'Plot points; identify quadrants', resources: 'Graph sheets, Desmos', status: 'Planned' }
        ];
        const materials = [
            { id: 'MT-01', teacher: 'T001', class: '10-A', subject: 'Mathematics', title: 'Quadratic Equations — Formula Sheet', type: 'PDF', size: '420 KB', date: rel(-4), downloads: 38 },
            { id: 'MT-02', teacher: 'T001', class: '10-A', subject: 'Mathematics', title: 'Half-Yearly Practice Paper Set A', type: 'PDF', size: '1.2 MB', date: rel(-2), downloads: 41 },
            { id: 'MT-03', teacher: 'T001', class: '10-B', subject: 'Mathematics', title: 'AP — Concept Video (12 min)', type: 'Video', size: '84 MB', date: rel(-6), downloads: 29 },
            { id: 'MT-04', teacher: 'T002', class: '10-A', subject: 'Physics', title: 'Ray Optics — Simulation Link', type: 'Link', size: '—', date: rel(-3), downloads: 35 },
            { id: 'MT-05', teacher: 'T004', class: '10-A', subject: 'Computer Science', title: 'Python Loops — Notebook', type: 'Notebook', size: '96 KB', date: rel(-1), downloads: 22 }
        ];

        const settings = {
            announcements: [
                'Admissions Open for Academic Year 2026–27 — limited seats in Grades 1, 6 & 11',
                `Half-Yearly Examinations begin ${U.fmtDate(rel(6))} — date sheets now in the student portal`,
                `Annual Science & Innovation Fair on ${U.fmtDate(rel(12))} — registrations open`,
                'Campus Open House every Saturday, 10 AM – 1 PM · Book a guided tour'
            ],
            holidays: HOLIDAYS,
            notifPrefs: { email: true, sms: true, push: true, digest: false }
        };

        const analytics = {
            studentGrowth: { labels: ['2019', '2020', '2021', '2022', '2023', '2024', '2025', '2026'], data: [1680, 1745, 1850, 1980, 2140, 2290, 2410, 2548] },
            admissions: { labels: ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'], applications: [148, 212, 265, 190, 172, 96, 54], enrolled: [0, 0, 38, 92, 145, 186, 212] },
            admissionsByGrade: { labels: ['Pre-Primary', 'Primary', 'Middle', 'Secondary', 'Sr. Secondary'], data: [124, 186, 142, 88, 96] },
            feeCollection: { labels: ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'], collected: [142, 38, 96, 118, 54, 88], pending: [12, 9, 14, 18, 16, 22] },
            performanceByGrade: { labels: ['Gr 6', 'Gr 7', 'Gr 8', 'Gr 9', 'Gr 10', 'Gr 11', 'Gr 12'], data: [84.2, 82.8, 81.5, 79.9, 83.4, 78.6, 86.1] },
            teacherPerformance: { labels: ['Mathematics', 'Science', 'English', 'Comp. Sci.', 'Social St.', 'Languages', 'Arts & PE'], data: [4.8, 4.7, 4.8, 4.9, 4.6, 4.7, 4.8] },
            attendanceWeek: { labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], data: [95.2, 94.8, 93.6, 96.1, 92.4, 90.8] },
            libraryUsage: { labels: ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'], data: [820, 310, 1240, 1580, 1720, 1650] },
            transportUsage: { labels: ['R1', 'R2', 'R3', 'R4', 'R5', 'R6'], data: [44, 41, 36, 46, 33, 38] }
        };

        return {
            users, students, parents, teachers: TEACHERS.map((t) => ({ ...t, status: 'Active', joined: 2026 - t.experience + Math.min(t.experience, 3) })),
            classes: CLASSES, timetable, attendance, attendanceLog, homework, assignments, exams, results, fees,
            events, notices, messages, notifications, books, loans, buses, admissions, lessonPlans, materials,
            settings, analytics, inquiries: [], newsletter: []
        };
    }

    EDU.content = content;
    EDU.seed = seed;
    EDU.ref = { SUBJECTS, TIMES, WEEKDAYS, CLASS_SUBJECTS, SCHOOL };
})(window.EDU);
