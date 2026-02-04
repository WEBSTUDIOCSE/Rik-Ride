/**
 * Centralized Error Messages with Hinglish Meme References
 * 
 * Easy to modify all error messages from one place!
 * Updated with rowdy Bollywood dialogues 🎬
 */

export const AUTH_ERROR_MESSAGES = {
  // ============================================
  // STUDENT FORM ERRORS
  // ============================================
  
  // Name Validation Errors
  name: {
    required: 'Tera naam kya hai Basanti?', // Sholay style
    tooShort: 'Itna chhota naam? Poora naam likho!',
    tooLong: 'Bhai itna lamba naam kaun rakhta hai?',
    // Driver specific
    driverRequired: 'Naam bata, kaam hum bataenge.', // Gangs of Wasseypur
  },

  // Email Validation Errors
  email: {
    required: 'Email daalo pehle!',
    invalid: 'Ye @ kaun lagayega? Tera bhai?', // Rowdy mocking
    notFound: 'Kaun hai ye log? Kaha se aate hai ye log?', // Jolly LLB
    alreadyExists: 'Bhai pehle se account hai tera! Login kar!',
    // Driver specific
    driverInvalid: 'Google se dushmani hai kya? Sahi mail daal.', // Sarcastic
  },

  // University Email Errors
  universityEmail: {
    required: 'University email toh chahiye!',
    invalid: 'College ka mail de! Masti nahi!', // Demanding official proof
    wrongDomain: 'College ka mail de! Masti nahi!',
  },

  // Student ID Errors
  studentId: {
    required: 'Tu wahi hai na jo ID card bhool jata hai?', // Mocking forgetful students
    invalid: 'Nakli ID? 21 din mein paisa double scheme hai kya?', // Catching fake entry
  },

  // Department Errors
  department: {
    required: 'Kaunsi class mein hai tu? Bol!', // Interrogation mode
  },

  // Year Errors
  year: {
    required: 'Year batao apna!',
    invalid: 'Ye kaunsa year hai bhai?',
  },

  // Phone Number Errors
  phone: {
    required: 'Phone number chahiye!',
    invalid: 'Wrong number hai! Babu Rao ka number mat de.', // Hera Pheri
    tooShort: 'Wrong number hai! Babu Rao ka number mat de.',
    tooLong: 'Itne digit? Ye number hai ya code?',
    // Driver specific
    driverRequired: 'Sawaari kya kabootar se bulayega? Number de!', // Old school logic
  },

  // Parent Phone Errors
  parentPhone: {
    required: 'Papa ko phone lagau kya? Dar mat!', // Scaring playfully
    invalid: 'Papa ko phone lagau kya? Dar mat!',
    sameAsPersonal: 'Baap ban raha hai? Khud ka number mat de wahan!', // Catching them
  },

  // Password Validation Errors
  password: {
    required: 'Password toh daalo bhai!',
    tooShort: 'Choti bachi ho kya? Strong password rakh!', // Tiger Shroff
    weak: 'Password hai ya mazaak? Thoda heavy rakh.', // Driver version
  },

  // Confirm Password Errors - Multiple options (Random selection)
  confirmPassword: {
    required: 'Password confirm karna bhool gaye?',
    mismatch: [
      'Cheating karta hai tu! (Viraj Dobriyal style)', // Viral Kid
      'Yeh sab Doglapan hai! Ek password rakh!', // Ashneer Grover
      'Arey mujhe chakkar aane laga hai! Dono password match karo!', // Rajpal Yadav
    ],
  },

  // ============================================
  // DRIVER FORM ERRORS
  // ============================================

  // License Errors
  license: {
    required: 'Gaadi tera bhai chalayega... par license kahan hai?', // Salman/Welcome ref
    invalid: 'Gaadi tera bhai chalayega... par license kahan hai?',
    expired: 'Expiry ho gaya! Thulla (Police) pakdega!', // Warning about challan
  },

  // Aadhar Errors
  aadhar: {
    required: 'Link nahi hai kya? Sahi number daal.', // Common Aadhar joke
    invalid: 'Link nahi hai kya? Sahi number daal.',
    wrongLength: 'Link nahi hai kya? Sahi number daal.',
  },

  // Vehicle Errors
  vehicle: {
    registrationRequired: 'Hawa mein udayega kya rikshaw? Number plate bata!', // Reality check
    typeRequired: 'Auto hai ya Rocket? Select kar!', // Sarcasm
    modelRequired: 'Gaadi ka model batao!',
    capacityInvalid: 'Bas bas! Train nahi, Auto hai ye!', // Stopping overloading
    capacityTooHigh: 'Bas bas! Train nahi, Auto hai ye!',
  },

  // Document Upload Errors
  upload: {
    failed: 'Upload nahi hua! Dubara try karo!',
    fileTooLarge: 'File bahut badi hai! Chhoti file upload karo!',
    invalidType: 'Ye file type allowed nahi hai!',
    photoRequired: 'Shakal toh dikha, darenge nahi hum.', // Confidence/Swag
    documentRequired: 'Kagaz toh dikhane padenge!', // CAA meme ref
    licenseRequired: 'Kagaz toh dikhane padenge!',
    aadharRequired: 'Kagaz toh dikhane padenge!',
  },

  // Generic Errors
  generic: {
    somethingWrong: 'Kuch gadbad ho gayi! Phir se try karo!',
    networkError: 'Internet check karo bhai!',
    serverError: 'Server so gaya lag raha hai! Baad mein aao!',
  },

  // Success Messages
  success: {
    studentRegistered: 'Account ban gaya! Email check karo verify karne ke liye. 🎉',
    driverRegistered: 'Account ban gaya! Admin verify karega aur phir ride dene lag jaoge! 🛺',
    login: 'Welcome back! Chalo shuru karte hai! 🚀',
    emailSent: 'Email bhej diya! Check karo apna inbox! ✉️',
    updated: 'Update ho gaya! 👍',
  },
};

/**
 * Get a random error message from an array of options
 */
export function getRandomErrorMessage(messages: string[]): string {
  return messages[Math.floor(Math.random() * messages.length)];
}

/**
 * Get password mismatch error (random from 3 options)
 */
export function getPasswordMismatchError(): string {
  return getRandomErrorMessage(AUTH_ERROR_MESSAGES.confirmPassword.mismatch);
}
