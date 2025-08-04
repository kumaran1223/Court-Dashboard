# Court Data Fetcher Dashboard

A modern, user-friendly web application for searching and retrieving case information from the Delhi High Court database. Built with React, Node.js, and featuring a clean, professional interface for legal professionals and citizens.

## 🌟 Features

### **Simple Search Interface**
- **3-Field Search**: Case Type (dropdown) + Filing Year (dropdown) + Case Number (text)
- **No Format Requirements**: Accepts any reasonable case number format
- **Flexible Matching**: Multiple search strategies for maximum success rate
- **User-Friendly**: Zero validation friction, focus on functionality

### **Comprehensive Case Information**
- **Basic Details**: Parties, filing date, hearing dates, case status
- **Court Information**: Presiding judge, court number, case type
- **Legal Details**: Advocates, case value, relief sought, offense sections
- **Case History**: Total hearings, last order date, bail status
- **Document Access**: Orders, pleadings, evidence, and case documents

### **Professional Interface**
- **Modern Design**: Clean, responsive interface with dark/light mode
- **Legal Branding**: Professional color scheme with navy and gold
- **Organized Display**: Color-coded information sections
- **Mobile Friendly**: Responsive design for all devices

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn package manager

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/kumaran1223/Court-Dashboard.git
cd Court-Dashboard
```

2. **Install dependencies**
```bash
# Install root dependencies
npm install

# Install client dependencies
cd client
npm install

# Install server dependencies
cd ../server
npm install
```

3. **Start the development servers**

**Terminal 1 - Start the client:**
```bash
cd client
npm run dev
```

**Terminal 2 - Start the server:**
```bash
cd server
npm start
```

4. **Access the application**
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3001`

## 🔍 How to Use

### **Simple Search Process**
1. **Select Case Type**: Choose from Civil, Criminal, Writ Petition, etc.
2. **Select Filing Year**: Pick the year from the dropdown (2025, 2024, 2023...)
3. **Enter Case Number**: Type any reasonable format (no strict requirements)
4. **Click Search**: Get comprehensive case information instantly

### **Sample Test Cases**
Try these working examples:

| Case Type | Filing Year | Case Number | Expected Result |
|-----------|-------------|-------------|-----------------|
| Civil | 2023 | `123` | Reliance Industries case |
| Writ Petition | 2024 | `456` | Environmental case |
| Criminal | 2024 | `1234` | Criminal appeal case |

## 🛠️ Technology Stack

### **Frontend**
- **React 18**: Modern React with hooks and functional components
- **Vite**: Fast build tool and development server
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Beautiful, customizable icons
- **React Hot Toast**: Elegant toast notifications

### **Backend**
- **Node.js**: JavaScript runtime environment
- **Express.js**: Web application framework
- **CORS**: Cross-origin resource sharing
- **Body Parser**: Request body parsing middleware

### **Development Tools**
- **ESLint**: Code linting and formatting
- **Git**: Version control
- **npm**: Package management

## 🔧 Configuration

### **Environment Variables**
Create `.env` files in both client and server directories:

**client/.env**
```
VITE_API_URL=http://localhost:3001
```

**server/.env**
```
PORT=3001
NODE_ENV=development
```

## 🧪 Testing

### **Manual Testing**
1. Start both client and server
2. Navigate to `http://localhost:5173`
3. Try the sample test cases listed above
4. Verify search results and document downloads

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 👨‍💻 Author

**Kumaran**
- GitHub: [@kumaran1223](https://github.com/kumaran1223)
- Repository: [Court-Dashboard](https://github.com/kumaran1223/Court-Dashboard)

## 📞 Support

If you encounter any issues or have questions:
1. Check the [Issues](https://github.com/kumaran1223/Court-Dashboard/issues) page
2. Create a new issue with detailed description
3. Contact the maintainer through GitHub

---

**Made with ❤️ for the legal community**
