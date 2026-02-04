export const READING_CATEGORIES = [
  { id: 1, name: "A Book About Leadership", prompt: "Reflect on their qualities, challenges they faced and what made them effective. How can these leadership lessons apply to your own life?" },
  { id: 2, name: "A Book Set in a Country You Have Never Visited", prompt: "How did the setting impact your reading experience? Highlight 3 things that made the setting unique or challenging." },
  { id: 3, name: "A Book Recommended by a Friend", prompt: "Did the recommendation live up to your expectations? Outline 3 things that made you agree or disagree with their recommendation." },
  { id: 4, name: "A Book Adapted into a Movie or TV Show", prompt: "How did the adaptation compare to the book? Share 3 key differences or similarities you liked or disliked." },
  { id: 5, name: "A Book You Started But Never Finished", prompt: "What made you put this book down the first time? Was it worth picking up again? Highlight 3 reasons for your final opinion." },
  { id: 6, name: "A Book with a Protagonist of the Opposite Gender", prompt: "Did the gender of the protagonist change your perspective? Share 3 things you found interesting or unexpected." },
  { id: 7, name: "A Book That Made You Cry", prompt: "Why did this book evoke such a strong emotional response? Provide 3 reasons why it affected you so deeply." },
  { id: 8, name: "A Graphic Novel or Comic Book", prompt: "Did the artwork enhance the storytelling? Share 3 aspects of the visuals and narrative that you appreciated." },
  { id: 9, name: "A Book Based on True Events", prompt: "How did knowing the story was based on real events affect your reading? Mention 3 elements that stood out." },
  { id: 10, name: "A Book Set in Kenya", prompt: "Reflect on how the setting influenced the narrative. What did you learn about Kenya's people, traditions, or history?" },
  { id: 11, name: "A Book in A Genre You Never Read", prompt: "Why do you usually avoid this genre? Did this book change your perspective? Discuss 3 aspects you found intriguing." },
  { id: 12, name: "A Memoir", prompt: "How did the life story inspire, challenge, or resonate with you? What lessons or perspectives did you gain?" },
  { id: 13, name: "A Book That is Part of a Series", prompt: "Did it continue the story in a way that satisfied you, or did it leave you wanting more?" },
  { id: 14, name: "A Book Set in a School", prompt: "How did the school environment influence the characters and plot?" },
  { id: 15, name: "Free Choice", prompt: "Reflect on why you chose this particular book and how it resonated with you. Summarize a scene that stood out." },
  { id: 16, name: "A Sci-Fi or Futuristic Book", prompt: "How does the book explore possibilities beyond our current reality?" },
  { id: 17, name: "A Book with a Number in the Title", prompt: "What is the significance of the number in the story? How does it shape the events or characters?" },
  { id: 18, name: "A Fantasy Book", prompt: "What elements of fantasy did you enjoy the most? Did the world-building enhance your reading experience?" },
  { id: 19, name: "A Book with a Strong Female Lead", prompt: "How did her strengths and struggles shape the story? Did she inspire you in any way?" },
  { id: 20, name: "A Book About Friendship", prompt: "Reflect on how the relationships were portrayed. Did any friendships remind you of your own experiences?" },
  { id: 21, name: "A Book Set on a Different Continent", prompt: "Reflect on the unique setting and how it influenced the story. Did it make you curious about the place?" },
  { id: 22, name: "A Book That Made You Laugh", prompt: "What moments or characters made it humorous? Did it brighten your day?" },
  { id: 23, name: "A Book with a Plot Twist", prompt: "How did the ending change your perception of the entire story? Were you satisfied or disappointed?" },
  { id: 24, name: "A Collection of Poems", prompt: "Reflect on the themes, emotions and imagery used by the poet. Did any poem resonate with you personally?" },
  { id: 25, name: "A Book with a Happy Ending", prompt: "How did the resolution make you feel? Did it leave you feeling hopeful or satisfied?" },
  { id: 26, name: "A Book You Chose for Its Cover", prompt: "After reading, did the cover accurately represent the story? Would you have chosen it otherwise?" },
  { id: 27, name: "A Book with a Moral Lesson", prompt: "Reflect on how the lesson was presented. Did it resonate with you or make you think differently?" },
  { id: 28, name: "A Book About Overcoming Challenges", prompt: "Reflect on the lessons learned from their journey. Did it inspire or motivate you?" },
  { id: 29, name: "A Book Featuring Diverse Characters", prompt: "Reflect on how the story portrayed their experiences and culture. Did it help you see things differently?" },
  { id: 30, name: "A Book About Sports", prompt: "Reflect on themes of teamwork, perseverance, or competition. Did it change how you think about sports?" },
];

export const HOUSES = ['Kenya', 'Longonot', 'Kilimanjaro', 'Elgon'] as const;

// Updated year groups with Grade 10, 11, 12
export const YEAR_GROUPS = ['MYP5', 'G10', 'G11', 'G12', 'DP1', 'DP2'] as const;

export const CLASSES = ['Swara', 'Chui', 'Duma', 'Nyati', 'Twiga', 'Kifaru'] as const;

export const USER_ROLES = [
  { value: 'student', label: 'Student', requiresCode: true },
  { value: 'homeroom_tutor', label: 'Homeroom Tutor', requiresCode: false },
  { value: 'head_of_year', label: 'Head of Year', requiresCode: false },
  { value: 'house_patron', label: 'House Patron', requiresCode: false },
  { value: 'librarian', label: 'Librarian Staff', requiresCode: true },
  { value: 'staff', label: 'Other Staff', requiresCode: false },
] as const;

export type House = typeof HOUSES[number];
export type YearGroup = typeof YEAR_GROUPS[number];
export type ClassName = typeof CLASSES[number];
export type UserRole = typeof USER_ROLES[number]['value'];
