# Rik-Ride Signup Fields Reference

Complete list of all fields for Student and Driver signup forms with validation rules and Bollywood meme error messages! 🎬

---

## 📚 Student Signup Form Fields

| Field Name | Type | Required | Error Condition | Meme Dialogue | Vibe/Context |
|---|---|---|---|---|---|
| **Display Name** | Text | ✅ | Empty | "Tera naam kya hai Basanti?" | Sholay Style - Asking name aggressively |
| **Personal Email** | Email | ✅ | Invalid Format | "Ye @ kaun lagayega? Tera bhai?" | Rowdy mocking missing '@' or '.' |
| **University Email** | Email | ✅ | Not .edu or Invalid | "College ka mail de! Masti nahi!" | Demanding official proof seriously |
| **Student ID** | Text | ✅ | Empty | "Tu wahi hai na jo ID card bhool jata hai?" | Mocking forgetful students |
| **Student ID** | Text | ✅ | Invalid | "Nakli ID? 21 din mein paisa double scheme hai kya?" | Catching a fake entry |
| **Department** | Dropdown | ✅ | Empty | "Kaunsi class mein hai tu? Bol!" | Interrogation mode |
| **Year** | Dropdown | ✅ | Invalid | "Ye kaunsa year hai bhai?" | Confused |
| **Phone Number** | Phone | ✅ | Invalid/Short | "Wrong number hai! Babu Rao ka number mat de." | Hera Pheri reference |
| **Parent Phone** | Phone | ❌ | Empty/Invalid | "Papa ko phone lagau kya? Dar mat!" | Scaring them playfully |
| **Parent Phone** | Phone | ❌ | Same as Personal | "Baap ban raha hai? Khud ka number mat de wahan!" | Catching them using own number |
| **Password** | Password | ✅ | Weak (< 8 chars) | "Choti bachi ho kya? Strong password rakh!" | Tiger Shroff Dialogue 🐯 |
| **Confirm Password** | Password | ✅ | Mismatch | "Cheating karta hai tu! (Viraj Dobriyal style)" | Catching the mismatch 👶 |

### Department Options (Dropdown)
- Computer Science & Engineering
- Information Technology
- Electronics & Communication
- Mechanical Engineering
- Civil Engineering
- Electrical Engineering
- Chemical Engineering
- Biotechnology
- MBA
- MCA
- Other

### Year Options (Dropdown)
- Year 1
- Year 2
- Year 3
- Year 4

### Success Message
✅ "Account ban gaya! Email check karo verify karne ke liye. 🎉"

---

## 🛺 Driver Signup Form Fields

| Field Name | Type | Required | Error Condition | Meme Dialogue | Vibe/Context |
|---|---|---|---|---|---|
| **Display Name** | Text | ✅ | Empty | "Naam bata, kaam hum bataenge." | Gangs of Wasseypur vibe |
| **Email** | Email | ✅ | Invalid | "Google se dushmani hai kya? Sahi mail daal." | Sarcastic questioning |
| **Phone Number** | Phone | ✅ | Empty | "Sawaari kya kabootar se bulayega? Number de!" | Old school logic 🕊️ |
| **License Expiry** | Date | ✅ | Expired Date | "Expiry ho gaya! Thulla (Police) pakdega!" | Warning about challan 🚨 |
| **Vehicle Reg. No.** | Text | ✅ | Empty | "Hawa mein udayega kya rikshaw? Number plate bata!" | Reality check |
| **Vehicle Type** | Dropdown | ✅ | Not Selected | "Auto hai ya Rocket? Select kar!" | Sarcasm 🚀 |
| **Vehicle Model** | Text | ✅ | Empty | "Gaadi ka model batao!" | - |
| **Seating Capacity** | Number | ✅ | Too High (>4) | "Bas bas! Train nahi, Auto hai ye!" | Stopping overloading 🚂 |
| **License Upload** | File | ✅ | Missing | "Kagaz toh dikhane padenge!" | CAA meme ref 📋 |
| **Aadhar Upload** | File | ✅ | Missing | "Kagaz toh dikhane padenge!" | CAA meme ref 📋 |
| **Profile Photo** | File | ✅ | Missing | "Shakal toh dikha, darenge nahi hum." | Confidence/Swag 😎 |
| **Password** | Password | ✅ | Weak | "Password hai ya mazaak? Thoda heavy rakh." | Demanding toughness 💪 |
| **Confirm Password** | Password | ✅ | Mismatch | "Yeh sab Doglapan hai! Ek password rakh!" | Ashneer Grover 🦈 |

### Vehicle Type Options (Dropdown)
- Auto Rickshaw
- E-Rickshaw
- Tempo
- Other

### Success Message
✅ "Account ban gaya! Admin verify karega aur phir ride dene lag jaoge! 🛺"

---

## 🎯 All Error Messages (Meme Collection)

### Password Errors
| Error Type | Dialogue | Reference |
|---|---|---|
| Required | "Password toh daalo bhai!" | Generic |
| Too Short (< 8) | "Choti bachi ho kya? Strong password rakh!" | Tiger Shroff 🐯 |
| Weak | "Password hai ya mazaak? Thoda heavy rakh." | Rowdy |

### Confirm Password Errors (Random Selection - 3 options)
| # | Dialogue | Reference |
|---|---|---|
| 1 | "Cheating karta hai tu! (Viraj Dobriyal style)" | Viral Kid 👶 |
| 2 | "Yeh sab Doglapan hai! Ek password rakh!" | Ashneer Grover 🦈 |
| 3 | "Arey mujhe chakkar aane laga hai! Dono password match karo!" | Rajpal Yadav 😵 |

### Email Errors
| Error Type | Dialogue | Reference |
|---|---|---|
| Required | "Email daalo pehle!" | Generic |
| Invalid (Student) | "Ye @ kaun lagayega? Tera bhai?" | Rowdy |
| Invalid (Driver) | "Google se dushmani hai kya? Sahi mail daal." | Sarcastic |
| Not Found | "Kaun hai ye log? Kaha se aate hai ye log?" | Jolly LLB 🤔 |
| Already Exists | "Bhai pehle se account hai tera! Login kar!" | Generic |

### Phone Errors
| Error Type | Dialogue (Student) | Dialogue (Driver) |
|---|---|---|
| Invalid/Short | "Wrong number hai! Babu Rao ka number mat de." | "Sawaari kya kabootar se bulayega? Number de!" |

### Name Errors
| Error Type | Dialogue (Student) | Dialogue (Driver) |
|---|---|---|
| Required | "Tera naam kya hai Basanti?" | "Naam bata, kaam hum bataenge." |

### Upload Errors
| Error Type | Dialogue | Reference |
|---|---|---|
| Document Missing | "Kagaz toh dikhane padenge!" | CAA meme 📋 |
| Photo Missing | "Shakal toh dikha, darenge nahi hum." | Swag 😎 |
| File Too Large | "File bahut badi hai! Chhoti file upload karo!" | - |
| Failed | "Upload nahi hua! Dubara try karo!" | - |

---

## 📍 Location in Codebase

### Files Managing Validation
- **Error Messages**: `/src/lib/validations/error-messages.ts` ✨ **Centralized**
- **Validation Schema**: `/src/lib/validations/auth.ts`
- **Student Form**: `/src/components/auth/StudentSignupForm.tsx`
- **Driver Form**: `/src/components/auth/DriverSignupForm.tsx`
- **Types**: `/src/lib/types/user.types.ts`

### How to Modify Error Messages
1. Go to `/src/lib/validations/error-messages.ts`
2. Find the `AUTH_ERROR_MESSAGES` object
3. Update the message you want to change
4. Changes will automatically apply everywhere! 🔄

---

## 🔄 Key Differences: Student vs Driver

| Aspect | Student | Driver |
|---|---|---|
| **Color Scheme** | Green (#009944) | Yellow (#FFD700) |
| **Left Panel Message** | "Bus Ka Chakkar Chodo! 🎓" | "Sadak Ka Raja Ban! 🛺" |
| **Name Error** | "Tera naam kya hai Basanti?" | "Naam bata, kaam hum bataenge." |
| **Total Fields** | 10 | 12 (simplified) |
| **File Uploads** | None | 3 (License, Aadhar, Profile Photo) |
| **Verification** | Email verification | Admin verification |
| **Removed Fields** | - | ~~License Number~~, ~~Aadhar Number~~ (now upload only) |

---

## ✨ Recent Changes (Feb 2026)

### Simplified Driver Form
- ❌ Removed: License Number input field
- ❌ Removed: Aadhar Number input field  
- ✅ Kept: License Expiry date picker
- ✅ Compact upload buttons (side by side)
- ✅ Max seating capacity: 4 (Auto, not train!)

### New Meme Errors Added
- Sholay, Hera Pheri, Gangs of Wasseypur references
- CAA "Kagaz" meme for document uploads
- Ashneer Grover "Doglapan" for password mismatch
- Tiger Shroff "Choti bachi" for weak passwords

---

*Last Updated: 4 February 2026*
*All fields, validations, and meme messages are implemented and tested.* ✅ 🎬
