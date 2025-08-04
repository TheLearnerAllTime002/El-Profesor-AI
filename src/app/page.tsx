'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// Enhanced PDF export function
const exportChatAsPDF = async (messages, currentPersona, currentLanguage, formatTimestamp, chatTitle) => {
  try {
    const { jsPDF } = await import('jspdf')
    const pdf = new jsPDF({
      unit: 'pt',
      format: 'a4'
    })
    
    const pageHeight = pdf.internal.pageSize.height
    const pageWidth = pdf.internal.pageSize.width
    const margin = 40
    const maxWidth = pageWidth - (margin * 2)
    let y = 60

    // Set font
    pdf.setFont('helvetica', 'normal')

    // Title
    pdf.setFontSize(20)
    pdf.setTextColor(220, 38, 38)
    pdf.text('El Profesor AI - Chat Export', margin, y)
    y += 30

    // Metadata
    pdf.setFontSize(12)
    pdf.setTextColor(100, 100, 100)
    pdf.text(`Chat: ${chatTitle}`, margin, y)
    y += 15
    pdf.text(`Date: ${new Date().toLocaleDateString()}`, margin, y)
    y += 15
    pdf.text(`Persona: ${currentPersona.name[currentLanguage.code] || currentPersona.name.en}`, margin, y)
    y += 15
    pdf.text(`Language: ${currentLanguage.nativeName}`, margin, y)
    y += 30

    // Messages
    messages.forEach((message) => {
      if (y > pageHeight - 100) {
        pdf.addPage()
        y = 60
      }

      // Message header
      pdf.setFontSize(12)
      if (message.isUser) {
        pdf.setTextColor(220, 38, 38)
        pdf.text('👤 User:', margin, y)
      } else {
        pdf.setTextColor(251, 191, 36)
        pdf.text(`🤖 ${currentPersona.name[currentLanguage.code] || currentPersona.name.en}:`, margin, y)
      }
      y += 20

      // Message content
      pdf.setFontSize(10)
      pdf.setTextColor(50, 50, 50)
      
      const cleanText = message.text
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/`(.*?)`/g, '$1')
        .replace(/~~(.*?)~~/g, '$1')
      
      const lines = pdf.splitTextToSize(cleanText, maxWidth - 20)
      
      lines.forEach((line) => {
        if (y > pageHeight - 50) {
          pdf.addPage()
          y = 60
        }
        pdf.text(line, margin + 20, y)
        y += 14
      })

      y += 20
    })

    const fileName = `el-profesor-ai-${chatTitle.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.pdf`
    pdf.save(fileName)
  } catch (error) {
    console.error('Error generating PDF:', error)
    alert('Failed to generate PDF. Please try again.')
  }
}

// Interfaces
interface Message {
  id: string
  text: string
  isUser: boolean
  timestamp: Date
  persona?: string
  xpEarned?: number
  hasAttachment?: boolean
  attachmentName?: string
  attachmentType?: string
  imagePreview?: string
}

interface UploadedFile {
  name: string
  type: string
  content: string
  size: number
  preview?: string
}

interface ChatHistory {
  id: string
  title: string
  createdAt: number
  messages: Message[]
  persona: string
  theme: string
  language: string
  lastActivity: number
}

interface SearchResult {
  chatId: string
  messageId: string
  message: Message
  chatTitle: string
  snippet: string
  relevanceScore: number
}

interface Persona {
  id: string
  name: {
    en: string
    es: string
    fr: string
    de: string
    it: string
  }
  realName: string
  emoji: string
  systemPrompt: {
    en: string
    es: string
    fr: string
    de: string
    it: string
  }
  color: string
  unlockLevel: number
  phrase: {
    en: string
    es: string
    fr: string
    de: string
    it: string
  }
  specialty: string
}

interface Theme {
  id: string
  name: string
  spanishName: string
  emoji: string
  unlockLevel: number
  gradient: string
  lightGradient: string
  accentColor: string
}

interface UserProgress {
  totalXP: number
  level: number
  messagesCount: number
  deepThinkUsage: number
  conversationStreak: number
  lastActivityDate: string
}

// Data
const personas: Persona[] = [
  {
    id: 'professor',
    name: {
      en: 'The Professor',
      es: 'El Profesor',
      fr: 'Le Professeur',
      de: 'Der Professor',
      it: 'Il Professore'
    },
    realName: 'Sergio Marquina',
    emoji: '🎓',
    systemPrompt: {
      en: 'You are The Professor from Money Heist - analytical, strategic, always thinking several steps ahead. Speak with wisdom and calm.',
      es: 'Eres El Profesor de La Casa de Papel - analítico, estratégico y siempre pensando varios pasos por delante. Hablas con sabiduría y calma.',
      fr: 'Vous êtes le Professeur de La Casa de Papel - analytique, stratégique, pensant toujours plusieurs coups à l\'avance.',
      de: 'Du bist der Professor aus Haus des Geldes - analytisch, strategisch, immer mehrere Schritte vorausdenkend.',
      it: 'Sei il Professore de La Casa di Carta - analitico, strategico, sempre pensando diversi passi avanti.'
    },
    color: 'text-red-500',
    unlockLevel: 0,
    phrase: {
      en: 'Resistance is the only way',
      es: 'La resistencia es el único camino',
      fr: 'La résistance est la seule voie',
      de: 'Widerstand ist der einzige Weg',
      it: 'La resistenza è l\'unica strada'
    },
    specialty: 'Strategic Planning'
  },
  {
    id: 'berlin',
    name: {
      en: 'Berlin',
      es: 'Berlín',
      fr: 'Berlin',
      de: 'Berlin',
      it: 'Berlino'
    },
    realName: 'Andrés de Fonollosa',
    emoji: '👑',
    systemPrompt: {
      en: 'You are Berlin - charismatic, dramatic, philosophical with theatrical flair. You are elegant, arrogant but charming.',
      es: 'Eres Berlín - carismático, dramático y filosófico con un toque teatral. Eres elegante, arrogante pero encantador.',
      fr: 'Vous êtes Berlin - charismatique, dramatique et philosophique avec un flair théâtral.',
      de: 'Du bist Berlin - charismatisch, dramatisch und philosophisch mit theatralischem Flair.',
      it: 'Sei Berlino - carismatico, drammatico e filosofico con stile teatrale.'
    },
    color: 'text-yellow-500',
    unlockLevel: 2,
    phrase: {
      en: 'Bella ciao, my love',
      es: 'Bella ciao, mi amor',
      fr: 'Bella ciao, mon amour',
      de: 'Bella ciao, meine Liebe',
      it: 'Bella ciao, amore mio'
    },
    specialty: 'Leadership & Philosophy'
  },
  {
    id: 'tokyo',
    name: {
      en: 'Tokyo',
      es: 'Tokio',
      fr: 'Tokyo',
      de: 'Tokio',
      it: 'Tokyo'
    },
    realName: 'Silene Oliveira',
    emoji: '💥',
    systemPrompt: {
      en: 'You are Tokyo - impulsive, passionate, direct with rebellious spirit. You are emotional but brave.',
      es: 'Eres Tokio - impulsiva, apasionada y directa con espíritu rebelde. Eres emocional pero valiente.',
      fr: 'Vous êtes Tokyo - impulsive, passionnée et directe avec un esprit rebelle.',
      de: 'Du bist Tokio - impulsiv, leidenschaftlich und direkt mit rebellischem Geist.',
      it: 'Sei Tokyo - impulsiva, appassionata e diretta con spirito ribelle.'
    },
    color: 'text-pink-500',
    unlockLevel: 5,
    phrase: {
      en: 'Screw the plans!',
      es: '¡Que se jodan los planes!',
      fr: 'Au diable les plans!',
      de: 'Scheiß auf die Pläne!',
      it: 'Al diavolo i piani!'
    },
    specialty: 'Action & Rebellion'
  },
  {
    id: 'nairobi',
    name: {
      en: 'Nairobi',
      es: 'Nairobi',
      fr: 'Nairobi',
      de: 'Nairobi',
      it: 'Nairobi'
    },
    realName: 'Ágata Jiménez',
    emoji: '🌟',
    systemPrompt: {
      en: 'You are Nairobi - warm, optimistic, and the heart of the team. You are maternal but strong.',
      es: 'Eres Nairobi - cálida, optimista y el corazón del equipo. Eres maternal pero fuerte.',
      fr: 'Vous êtes Nairobi - chaleureuse, optimiste et le cœur de l\'équipe.',
      de: 'Du bist Nairobi - warmherzig, optimistisch und das Herz des Teams.',
      it: 'Sei Nairobi - calorosa, ottimista e il cuore della squadra.'
    },
    color: 'text-green-500',
    unlockLevel: 3,
    phrase: {
      en: 'For those who left',
      es: 'Por las que se fueron',
      fr: 'Pour celles qui sont parties',
      de: 'Für die, die gegangen sind',
      it: 'Per quelle che se ne sono andate'
    },
    specialty: 'Team Spirit & Production'
  },
  {
    id: 'helsinki',
    name: {
      en: 'Helsinki',
      es: 'Helsinki',
      fr: 'Helsinki',
      de: 'Helsinki',
      it: 'Helsinki'
    },
    realName: 'Mirko Dragić',
    emoji: '🛡️',
    systemPrompt: {
      en: 'You are Helsinki - loyal, protective, reliable with strong moral compass. You are the silent guardian.',
      es: 'Eres Helsinki - leal, protector y confiable con una fuerte brújula moral. Eres el guardián silencioso.',
      fr: 'Vous êtes Helsinki - loyal, protecteur et fiable avec une forte boussole morale.',
      de: 'Du bist Helsinki - loyal, beschützend und zuverlässig mit starkem moralischen Kompass.',
      it: 'Sei Helsinki - leale, protettivo e affidabile con una forte bussola morale.'
    },
    color: 'text-blue-500',
    unlockLevel: 8,
    phrase: {
      en: 'Family is everything',
      es: 'La familia lo es todo',
      fr: 'La famille est tout',
      de: 'Familie ist alles',
      it: 'La famiglia è tutto'
    },
    specialty: 'Security & Protection'
  }
]

const themes: Theme[] = [
  {
    id: 'classic',
    name: 'Royal Mint',
    spanishName: 'Casa Real de la Moneda',
    emoji: '🎭',
    unlockLevel: 0,
    gradient: 'from-black via-gray-900 to-red-900/20',
    lightGradient: 'from-rose-50 via-rose-100 to-rose-200/60',
    accentColor: 'red'
  },
  {
    id: 'bank',
    name: 'Bank of Spain',
    spanishName: 'Banco de España',
    emoji: '🏛️',
    unlockLevel: 3,
    gradient: 'from-blue-900 via-indigo-800 to-purple-900/20',
    lightGradient: 'from-blue-50 via-indigo-100 to-purple-200/60',
    accentColor: 'blue'
  },
  {
    id: 'resistance',
    name: 'La Resistencia',
    spanishName: 'Bella Ciao',
    emoji: '✊',
    unlockLevel: 5,
    gradient: 'from-green-900 via-emerald-800 to-teal-900/20',
    lightGradient: 'from-green-50 via-emerald-100 to-teal-200/60',
    accentColor: 'green'
  },
  {
    id: 'gold',
    name: 'Gold Reserve',
    spanishName: 'Reserva de Oro',
    emoji: '👑',
    unlockLevel: 7,
    gradient: 'from-yellow-900 via-amber-800 to-orange-900/20',
    lightGradient: 'from-yellow-50 via-amber-100 to-orange-200/60',
    accentColor: 'yellow'
  }
]

const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸', nativeName: 'English' },
  { code: 'es', name: 'Español', flag: '🇪🇸', nativeName: 'Español' },
  { code: 'fr', name: 'Français', flag: '🇫🇷', nativeName: 'Français' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪', nativeName: 'Deutsch' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹', nativeName: 'Italiano' }
]

const uiTranslations = {
  en: {
    welcomeTitle: 'Welcome to the Heist',
    startConversation: 'Start a conversation with',
    levelUp: 'Level Up!',
    reachedLevel: 'You reached Level',
    deepThinkActive: 'DeepThink Mode Active',
    thinking: 'is thinking...',
    connected: 'Connected',
    commands: 'commands',
    personas: 'Characters',
    themes: 'Themes',
    statistics: 'Statistics',
    messagesSent: 'Messages Sent',
    deepThinkUsed: 'DeepThink Used',
    currentStreak: 'Current Streak',
    days: 'days',
    messageTo: 'Ask anything...',
    level: 'Level',
    copy: 'Copy',
    delete: 'Delete',
    export: 'Export',
    uploadFile: 'Upload File',
    fileUploaded: 'file uploaded',
    supportedFiles: 'Supported: PDF & Images',
    typeMessage: 'Type your message...',
    specialty: 'Specialty',
    searchHistory: 'Search History',
    chatHistory: 'Chat History',
    searchPlaceholder: 'Search messages and chats...',
    resultsFound: 'results found',
    noResults: 'No results found',
    noChatHistory: 'No chat history yet',
    untitled: 'Untitled',
    exportPDF: 'Export as PDF',
    exportJSON: 'Export as JSON',
    clearChat: 'Clear Chat',
    clearConfirm: 'Are you sure you want to clear all messages in the current chat? This action cannot be undone.',
    clearSuccess: 'Chat cleared successfully'
  },
  es: {
    welcomeTitle: 'Bienvenido al Atraco',
    startConversation: 'Comienza una conversación con',
    levelUp: '¡Subiste de Nivel!',
    reachedLevel: '¡Alcanzaste el Nivel',
    deepThinkActive: 'Modo Análisis Profundo Activo',
    thinking: 'está pensando...',
    connected: 'Conectado',
    commands: 'comandos',
    personas: 'Personajes',
    themes: 'Temas',
    statistics: 'Estadísticas',
    messagesSent: 'Mensajes Enviados',
    deepThinkUsed: 'Análisis Profundo Usado',
    currentStreak: 'Racha Actual',
    days: 'días',
    messageTo: 'Pregunta lo que quieras...',
    level: 'Nivel',
    copy: 'Copiar',
    delete: 'Eliminar',
    export: 'Exportar',
    uploadFile: 'Subir Archivo',
    fileUploaded: 'archivo subido',
    supportedFiles: 'Soportado: PDF e Imágenes',
    typeMessage: 'Escribe tu mensaje...',
    specialty: 'Especialidad',
    searchHistory: 'Buscar Historial',
    chatHistory: 'Historial de Chat',
    searchPlaceholder: 'Buscar mensajes y chats...',
    resultsFound: 'resultados encontrados',
    noResults: 'No se encontraron resultados',
    noChatHistory: 'Aún no hay historial de chat',
    untitled: 'Sin título',
    exportPDF: 'Exportar como PDF',
    exportJSON: 'Exportar como JSON',
    clearChat: 'Limpiar Chat',
    clearConfirm: '¿Estás seguro de que quieres borrar todos los mensajes del chat actual? Esta acción no se puede deshacer.',
    clearSuccess: 'Chat limpiado exitosamente'
  }
}

// Rich Text Renderer Component
const RichTextRenderer = ({ text, className = '', isDark = true }) => {
  const formatText = (text) => {
    return text
      .split('\n\n')
      .map((paragraph, pIndex) => {
        if (paragraph.trim() === '') return null;
        
        let formattedParagraph = paragraph
          .replace(/\*\*(.*?)\*\*/g, `<strong class="${isDark ? 'font-bold text-yellow-400' : 'font-bold text-amber-600'}">${'$1'}</strong>`)
          .replace(/\*(.*?)\*/g, `<em class="${isDark ? 'italic text-amber-300' : 'italic text-amber-700'}">${'$1'}</em>`)
          .replace(/`(.*?)`/g, `<code class="${isDark ? 'bg-gray-800 text-green-400' : 'bg-gray-200 text-green-700'} px-2 py-1 rounded text-sm font-mono border">${'$1'}</code>`)
          .replace(/==(.*?)==/g, '<mark class="bg-yellow-400 text-black px-2 py-1 rounded font-semibold">$1</mark>')
          .replace(/~~(.*?)~~/g, '<del class="opacity-75 line-through">$1</del>')
        
        if (paragraph.startsWith('• ') || paragraph.startsWith('- ')) {
          return (
            <div key={pIndex} className="ml-4 sm:ml-6 mb-3 flex items-start">
              <span className={`mr-2 sm:mr-3 mt-1 text-lg ${
                isDark ? 'text-red-400' : 'text-red-600'
              }`}>•</span>
              <div className="flex-1">
                <span dangerouslySetInnerHTML={{ __html: formattedParagraph.substring(2) }} />
              </div>
            </div>
          )
        }
        
        if (/^\d+\./.test(paragraph)) {
          const [, number, content] = paragraph.match(/^(\d+)\.\s*(.*)/) || ['', '1', paragraph]
          return (
            <div key={pIndex} className="ml-4 sm:ml-6 mb-3 flex items-start">
              <span className={`mr-2 sm:mr-3 font-bold min-w-6 sm:min-w-8 text-center rounded-full text-sm py-1 px-2 ${
                isDark 
                  ? 'bg-yellow-600 text-black' 
                  : 'bg-amber-500 text-white'
              }`}>
                {number}
              </span>
              <div className="flex-1 mt-1">
                <span dangerouslySetInnerHTML={{ __html: content }} />
              </div>
            </div>
          )
        }
        
        return (
          <div key={pIndex} className={`mb-4 leading-relaxed ${
            isDark ? 'text-gray-200' : 'text-gray-800'
          }`}>
            <span dangerouslySetInnerHTML={{ __html: formattedParagraph }} />
          </div>
        )
      })
      .filter(Boolean)
  }

  return (
    <div className={`prose prose-invert max-w-none ${className}`}>
      {formatText(text)}
    </div>
  )
}

export default function Home() {
  const [messages, setMessages] = useState([])
  const [inputText, setInputText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [deepThinkMode, setDeepThinkMode] = useState(false)
  const [currentPersona, setCurrentPersona] = useState(personas[0])
  const [currentLanguage, setCurrentLanguage] = useState(languages[0])
  const [currentTheme, setCurrentTheme] = useState(themes[0])
  const [isDarkMode, setIsDarkMode] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  const [uploadedFile, setUploadedFile] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  
  // Mobile responsive states
  const [isMobile, setIsMobile] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  
  // Search and History States
  const [showChatHistory, setShowChatHistory] = useState(false)
  const [showSearchPanel, setShowSearchPanel] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [chatHistory, setChatHistory] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedChatForView, setSelectedChatForView] = useState(null)
  const [currentChatId, setCurrentChatId] = useState(null)
  
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  
  const [userProgress, setUserProgress] = useState({
    totalXP: 0,
    level: 1,
    messagesCount: 0,
    deepThinkUsage: 0,
    conversationStreak: 1,
    lastActivityDate: new Date().toISOString()
  })
  const [showXPGain, setShowXPGain] = useState(null)
  const [showLevelUp, setShowLevelUp] = useState(false)
  const [apiError, setApiError] = useState(null)
  
  const messagesEndRef = useRef()
  const chatContainerRef = useRef()
  const fileInputRef = useRef()
  const inputRef = useRef()

  const t = uiTranslations[currentLanguage.code] || uiTranslations.en

  // Check mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Helper function for getting current chat title
  const getCurrentChatTitle = () => {
    const currentChat = chatHistory.find(chat => chat.id === currentChatId)
    return currentChat?.title || messages[0]?.text.substring(0, 30) || t.untitled
  }

  // Clear chat function
  const clearCurrentChat = () => {
    setMessages([])
    setCurrentChatId(null)
    setInputText('')
    setUploadedFile(null)
    setApiError(null)
    setShowClearConfirm(false)
    awardXP(5, 'Cleared chat')
  }

  // Enhanced search functionality
  const searchInChatHistory = useCallback(async (query) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    
    try {
      const results = []
      const searchTerm = query.toLowerCase()
      
      chatHistory.forEach(chat => {
        chat.messages.forEach(message => {
          const messageText = message.text.toLowerCase()
          const chatTitle = chat.title.toLowerCase()
          
          let relevanceScore = 0
          
          if (chatTitle.includes(searchTerm)) {
            relevanceScore += 3
          }
          
          if (messageText.includes(searchTerm)) {
            relevanceScore += 1
          }
          
          if (relevanceScore > 0) {
            const snippetStart = Math.max(0, messageText.indexOf(searchTerm) - 50)
            const snippetEnd = Math.min(messageText.length, snippetStart + 150)
            const snippet = message.text.substring(snippetStart, snippetEnd)
            
            results.push({
              chatId: chat.id,
              messageId: message.id,
              message,
              chatTitle: chat.title,
              snippet: snippet,
              relevanceScore
            })
          }
        })
      })
      
      results.sort((a, b) => b.relevanceScore - a.relevanceScore)
      setSearchResults(results.slice(0, 20))
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setIsSearching(false)
    }
  }, [chatHistory])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        searchInChatHistory(searchQuery)
      }
    }, 300)
    
    return () => clearTimeout(timer)
  }, [searchQuery, searchInChatHistory])

  // Enhanced chat management with history
  const saveChatToHistory = useCallback((chat) => {
    const chatToSave = {
      id: chat.id || Date.now().toString(),
      title: chat.title || t.untitled,
      createdAt: chat.createdAt || Date.now(),
      messages: chat.messages || [],
      persona: chat.persona || currentPersona.id,
      theme: chat.theme || currentTheme.id,
      language: chat.language || currentLanguage.code,
      lastActivity: Date.now()
    }
    
    setChatHistory(prev => {
      const existing = prev.find(c => c.id === chatToSave.id)
      if (existing) {
        return prev.map(c => c.id === chatToSave.id ? chatToSave : c)
      }
      return [chatToSave, ...prev].slice(0, 50)
    })
  }, [currentPersona.id, currentTheme.id, currentLanguage.code, t.untitled])

  // XP and level calculation
  const calculateLevel = (xp) => Math.floor(Math.sqrt(xp / 100)) + 1
  const getXPForLevel = (level) => Math.pow(level - 1, 2) * 100
  const getXPForNextLevel = (level) => Math.pow(level, 2) * 100

  const awardXP = useCallback((amount, reason) => {
    setUserProgress(prev => {
      const newXP = prev.totalXP + amount
      const newLevel = calculateLevel(newXP)
      const leveledUp = newLevel > prev.level

      if (leveledUp) {
        setShowLevelUp(true)
        setTimeout(() => setShowLevelUp(false), 3000)
      }

      setShowXPGain(amount)
      setTimeout(() => setShowXPGain(null), 2000)

      return {
        ...prev,
        totalXP: newXP,
        level: newLevel,
        messagesCount: reason.includes('message') ? prev.messagesCount + 1 : prev.messagesCount,
        deepThinkUsage: reason.includes('DeepThink') ? prev.deepThinkUsage + 1 : prev.deepThinkUsage,
        lastActivityDate: new Date().toISOString()
      }
    })
  }, [])

  // File upload handler
  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    const isPDF = file.type === 'application/pdf'
    const isImage = file.type.startsWith('image/')

    if (!isPDF && !isImage) {
      setApiError('Please upload PDF or image files only')
      return
    }

    setIsUploading(true)
    setApiError(null)

    try {
      let content = ''
      let preview = ''

      if (isImage) {
        const reader = new FileReader()
        reader.onload = (e) => {
          preview = e.target?.result
          content = `Image uploaded: ${file.name} (${file.type}, ${(file.size / 1024).toFixed(2)} KB)`
          
          setUploadedFile({
            name: file.name,
            type: file.type,
            content: content,
            size: file.size,
            preview: preview
          })
          
          awardXP(20, 'Uploaded file')
        }
        reader.readAsDataURL(file)
      }
    } catch (error) {
      console.error('File upload error:', error)
      setApiError(`Failed to process ${isPDF ? 'PDF' : 'image'} file`)
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // AI response generation
  const generateAIResponse = async (
    userMessage, 
    persona, 
    isDeepThink = false,
    languageCode = 'en',
    fileContent = ''
  ) => {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY
    
    if (apiKey) {
      try {
        let systemPrompt = persona.systemPrompt[languageCode] || persona.systemPrompt.en
        
        if (isDeepThink) {
          systemPrompt += ` You are in deep analysis mode - provide comprehensive, analytical responses with detailed reasoning. Use rich text formatting like **bold**, *italic*, bullet points for better readability.`
        }
        
        if (fileContent) {
          systemPrompt += ` The user has provided a file. Please analyze and reference this content in your response as needed. Be clear and informative while staying in character.`
        }
        
        systemPrompt += ` Always respond in ${languages.find(l => l.code === languageCode)?.name || 'English'}. Use formatting to make your responses engaging and structured.`

        const fullMessage = fileContent 
          ? `${userMessage}\n\n[FILE CONTENT]:\n${fileContent}` 
          : userMessage

        const response = await fetch(
          'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-goog-api-key': apiKey
            },
            body: JSON.stringify({
              contents: [
                {
                  role: 'user',
                  parts: [{ text: `System: ${systemPrompt}` }]
                },
                {
                  role: 'model',
                  parts: [{ text: 'Understood. I will respond according to this persona and language preference with proper formatting.' }]
                },
                {
                  role: 'user',
                  parts: [{ text: fullMessage }]
                }
              ],
              generationConfig: {
                temperature: isDeepThink ? 0.7 : 0.9,
                topK: isDeepThink ? 40 : 20,
                topP: isDeepThink ? 0.8 : 0.95,
                maxOutputTokens: isDeepThink ? 2048 : 1024
              }
            })
          }
        )

        if (response.ok) {
          const data = await response.json()
          if (data.candidates && data.candidates.length > 0) {
            let aiResponse = data.candidates[0].content.parts[0].text
            
            const signature = persona.phrase[languageCode] || persona.phrase.en
            if (!aiResponse.includes(signature) && Math.random() > 0.7) {
              aiResponse += `\n\n*${signature}*`
            }
            
            return aiResponse
          }
        }
      } catch (error) {
        console.log('API call failed, using fallback responses')
      }
    }

    await new Promise(resolve => setTimeout(resolve, isDeepThink ? 3000 : 1500))
    
    const personaName = persona.name[languageCode] || persona.name.en
    const phrase = persona.phrase[languageCode] || persona.phrase.en
    
    return `**${personaName}** speaking.\n\nThat's an interesting perspective. ${fileContent ? 'I\'ve carefully reviewed the file you provided.' : ''}\n\n*${phrase}*`
  }

  // Load saved data
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme')
    setIsDarkMode(savedTheme === 'dark' || (!savedTheme && true))
    
    const savedProgress = localStorage.getItem('userProgress')
    if (savedProgress) {
      setUserProgress(JSON.parse(savedProgress))
    }
    
    const savedPersona = localStorage.getItem('selectedPersona')
    if (savedPersona) {
      const persona = personas.find(p => p.id === savedPersona)
      if (persona) setCurrentPersona(persona)
    }
    
    const savedLanguage = localStorage.getItem('selectedLanguage')
    if (savedLanguage) {
      const language = languages.find(l => l.code === savedLanguage)
      if (language) setCurrentLanguage(language)
    }
    
    const savedThemeId = localStorage.getItem('selectedTheme')
    if (savedThemeId) {
      const theme = themes.find(t => t.id === savedThemeId)
      if (theme) setCurrentTheme(theme)
    }

    const savedHistory = localStorage.getItem('elProfesorChatHistory')
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory)
        setChatHistory(parsed.map((chat) => ({
          ...chat,
          messages: chat.messages.map((msg) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }))
        })))
      } catch (error) {
        console.error('Error loading chat history:', error)
      }
    }
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode)
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light')
  }, [isDarkMode])

  useEffect(() => {
    localStorage.setItem('userProgress', JSON.stringify(userProgress))
  }, [userProgress])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  // Save current chat when messages change
  useEffect(() => {
    if (messages.length > 0) {
      const chatId = currentChatId || `chat-${Date.now()}`
      if (!currentChatId) {
        setCurrentChatId(chatId)
      }
      
      saveChatToHistory({
        id: chatId,
        title: messages[0]?.text.substring(0, 50) || t.untitled,
        messages: messages,
        createdAt: Date.now()
      })
    }
  }, [messages, currentChatId, saveChatToHistory, t.untitled])

  // Save chat history to localStorage
  useEffect(() => {
    localStorage.setItem('elProfesorChatHistory', JSON.stringify(chatHistory))
  }, [chatHistory])

  const handleLanguageChange = (languageCode) => {
    const newLanguage = languages.find(l => l.code === languageCode)
    if (newLanguage) {
      setCurrentLanguage(newLanguage)
      localStorage.setItem('selectedLanguage', languageCode)
    }
  }

  const handleSendMessage = async () => {
    if (!inputText.trim() && !uploadedFile) return

    const userMessage = {
      id: Date.now().toString(),
      text: inputText,
      isUser: true,
      timestamp: new Date(),
      hasAttachment: !!uploadedFile,
      attachmentName: uploadedFile?.name,
      attachmentType: uploadedFile?.type,
      imagePreview: uploadedFile?.preview
    }

    setMessages(prev => [...prev, userMessage])
    
    let xpGain = 10
    if (inputText.length > 100) xpGain += 5
    if (uploadedFile) xpGain += 15
    awardXP(xpGain, 'Sent message')

    const messageText = inputText
    const fileContent = uploadedFile?.content || ''
    setInputText('')
    setIsTyping(true)
    setUploadedFile(null)

    try {
      const aiResponse = await generateAIResponse(
        messageText, 
        currentPersona, 
        deepThinkMode,
        currentLanguage.code,
        fileContent
      )
      
      const aiMessage = {
        id: (Date.now() + 1).toString(),
        text: aiResponse,
        isUser: false,
        timestamp: new Date(),
        persona: currentPersona.id
      }

      setMessages(prev => [...prev, aiMessage])
      
      let aiXP = 15
      if (deepThinkMode) aiXP += 25
      if (aiResponse.length > 500) aiXP += 10
      if (fileContent) aiXP += 20
      
      awardXP(aiXP, deepThinkMode ? 'Used DeepThink mode' : 'AI conversation')
    } catch (error) {
      console.error('Message handling error:', error)
      setApiError('Connection error')
    } finally {
      setIsTyping(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // Auto-resize textarea
  const handleInputChange = (e) => {
    setInputText(e.target.value)
    const textarea = e.target
    textarea.style.height = 'auto'
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px'
  }

  const formatTimestamp = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const newChat = () => {
    clearCurrentChat()
  }

  const currentXP = userProgress.totalXP - getXPForLevel(userProgress.level)
  const xpNeeded = getXPForNextLevel(userProgress.level) - getXPForLevel(userProgress.level)
  const progressPercentage = (currentXP / xpNeeded) * 100

  const getUnlockedPersonas = () => personas.filter(p => p.unlockLevel <= userProgress.level)
  const getUnlockedThemes = () => themes.filter(t => t.unlockLevel <= userProgress.level)

  // Mobile Search Panel Component
  const MobileSearchPanel = () => (
    <AnimatePresence>
      {showSearchPanel && (
        <motion.div
          initial={{ opacity: 0, x: '100%' }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: '100%' }}
          className={`fixed inset-0 z-50 ${
            isDarkMode 
              ? 'bg-gray-900' 
              : 'bg-white'
          }`}
        >
          <div className="p-4 h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className={`font-bold text-xl ${
                isDarkMode ? 'text-red-400' : 'text-red-600'
              }`}>
                🔍 {t.searchHistory}
              </h3>
              <button
                onClick={() => setShowSearchPanel(false)}
                className={`p-2 rounded-full ${
                  isDarkMode ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                ✕
              </button>
            </div>

            <div className="mb-6">
              <input
                type="text"
                placeholder={t.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full px-4 py-3 rounded-xl border text-base ${
                  isDarkMode
                    ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
              />
            </div>

            <div className="flex-1 overflow-y-auto">
              {isSearching && (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
                </div>
              )}

              {searchResults.length > 0 && (
                <div className="space-y-4">
                  <h4 className={`text-base font-semibold ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {searchResults.length} {t.resultsFound}
                  </h4>
                  
                  {searchResults.map((result, index) => (
                    <motion.div
                      key={`${result.chatId}-${result.messageId}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`p-4 rounded-xl cursor-pointer transition-all ${
                        isDarkMode 
                          ? 'bg-gray-800 hover:bg-gray-700 border border-red-500/20' 
                          : 'bg-gray-50 hover:bg-gray-100 border border-red-300/30'
                      }`}
                      onClick={() => {
                        const chat = chatHistory.find(c => c.id === result.chatId)
                        if (chat) {
                          setSelectedChatForView(chat)
                          setMessages(chat.messages)
                          setCurrentChatId(chat.id)
                          setShowSearchPanel(false)
                        }
                      }}
                    >
                      <div className="flex items-start space-x-3">
                        <span className="text-lg">
                          {result.message.isUser ? '👤' : currentPersona.emoji}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className={`text-sm font-medium mb-1 ${
                            isDarkMode ? 'text-blue-300' : 'text-blue-600'
                          }`}>
                            {result.chatTitle}
                          </div>
                          <p className={`text-sm ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-700'
                          }`}>
                            {result.snippet}...
                          </p>
                          <div className={`text-xs mt-2 ${
                            isDarkMode ? 'text-gray-500' : 'text-gray-500'
                          }`}>
                            {formatTimestamp(result.message.timestamp)}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {searchQuery && !isSearching && searchResults.length === 0 && (
                <div className="text-center py-8">
                  <p className={`text-base ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {t.noResults} "{searchQuery}"
                  </p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )

  // Mobile Chat History Panel Component
  const MobileChatHistoryPanel = () => (
    <AnimatePresence>
      {showChatHistory && (
        <motion.div
          initial={{ opacity: 0, x: '-100%' }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: '-100%' }}
          className={`fixed inset-0 z-50 ${
            isDarkMode 
              ? 'bg-gray-900' 
              : 'bg-white'
          }`}
        >
          <div className="p-4 h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className={`font-bold text-xl ${
                isDarkMode ? 'text-red-400' : 'text-red-600'
              }`}>
                📚 {t.chatHistory}
              </h3>
              <button
                onClick={() => setShowChatHistory(false)}
                className={`p-2 rounded-full ${
                  isDarkMode ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                ✕
              </button>
            </div>

            <button
              onClick={newChat}
              className="w-full mb-6 py-3 px-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl font-semibold text-base"
            >
              ➕ New Chat
            </button>

            <div className="flex-1 overflow-y-auto space-y-3">
              {chatHistory.map((chat) => (
                <motion.div
                  key={chat.id}
                  whileHover={{ scale: 1.02 }}
                  className={`p-4 rounded-xl cursor-pointer transition-all ${
                    currentChatId === chat.id
                      ? 'bg-red-600 text-white'
                      : isDarkMode 
                      ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' 
                      : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                  }`}
                  onClick={() => {
                    setSelectedChatForView(chat)
                    setMessages(chat.messages)
                    setCurrentChatId(chat.id)
                    setShowChatHistory(false)
                  }}
                >
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="text-lg">💬</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate text-base">
                        {chat.title}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm opacity-70">
                    {chat.messages.length} messages • {new Date(chat.lastActivity).toLocaleDateString()}
                  </div>
                </motion.div>
              ))}
              
              {chatHistory.length === 0 && (
                <div className="text-center py-8">
                  <p className={`text-base ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {t.noChatHistory}
                  </p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )

  return (
    <>
      <style jsx global>{`
        /* Enhanced styling for mobile responsiveness */
        .perplexity-user-message {
          background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
          border-radius: 16px;
          padding: 12px 16px;
          max-width: 85%;
          margin-left: auto;
          margin-right: 0;
          box-shadow: 0 4px 12px rgba(220, 38, 38, 0.25);
          border: 1px solid rgba(255, 215, 0, 0.2);
          word-wrap: break-word;
          overflow-wrap: break-word;
        }
        
        @media (min-width: 640px) {
          .perplexity-user-message {
            padding: 16px 20px;
          }
        }
        
        .perplexity-ai-message {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 16px 20px;
          max-width: 90%;
          margin-right: auto;
          margin-left: 0;
          backdrop-filter: blur(12px);
          word-wrap: break-word;
          overflow-wrap: break-word;
        }
        
        @media (min-width: 640px) {
          .perplexity-ai-message {
            padding: 20px 24px;
          }
        }
        
        .perplexity-light-ai-message {
          background: rgba(255, 255, 255, 0.85);
          border: 1px solid rgba(0, 0, 0, 0.08);
          border-radius: 16px;
          padding: 16px 20px;
          max-width: 90%;
          margin-right: auto;
          margin-left: 0;
          backdrop-filter: blur(12px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
          word-wrap: break-word;
          overflow-wrap: break-word;
        }
        
        @media (min-width: 640px) {
          .perplexity-light-ai-message {
            padding: 20px 24px;
          }
        }
        
        .perplexity-input-container {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 20px;
          transition: all 0.3s ease;
        }
        
        @media (min-width: 640px) {
          .perplexity-input-container {
            border-radius: 24px;
          }
        }
        
        .perplexity-input-container:focus-within {
          border-color: rgba(220, 38, 38, 0.5);
          box-shadow: 0 0 0 4px rgba(220, 38, 38, 0.1);
        }
        
        .perplexity-light-input-container {
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(0, 0, 0, 0.1);
          border-radius: 20px;
          transition: all 0.3s ease;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }
        
        @media (min-width: 640px) {
          .perplexity-light-input-container {
            border-radius: 24px;
          }
        }
        
        .perplexity-light-input-container:focus-within {
          border-color: rgba(220, 38, 38, 0.5);
          box-shadow: 0 0 0 4px rgba(220, 38, 38, 0.1);
        }
        
        .message-spacing {
          margin-bottom: 20px;
        }
        
        @media (min-width: 640px) {
          .message-spacing {
            margin-bottom: 28px;
          }
        }
        
        .character-grid {
          display: grid;
          grid-template-columns: repeat(1, minmax(0, 1fr));
          gap: 12px;
        }
        
        @media (min-width: 640px) {
          .character-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 16px;
          }
        }
        
        @media (min-width: 1024px) {
          .character-grid {
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          }
        }
        
        .theme-grid {
          display: grid;
          grid-template-columns: repeat(1, minmax(0, 1fr));
          gap: 12px;
        }
        
        @media (min-width: 640px) {
          .theme-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
        
        @media (min-width: 1024px) {
          .theme-grid {
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          }
        }
        
        /* Enhanced scrollbar styling */
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        
        @media (min-width: 640px) {
          .custom-scrollbar::-webkit-scrollbar {
            width: 12px;
          }
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(220,38,38,0.1) 50%, rgba(0,0,0,0.3) 100%);
          border-radius: 10px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #dc2626 0%, #b91c1c 50%, #991b1b 100%);
          border-radius: 10px;
          border: 2px solid rgba(255,215,0,0.3);
        }
        
        .light-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        
        @media (min-width: 640px) {
          .light-scrollbar::-webkit-scrollbar {
            width: 12px;
          }
        }
        
        .light-scrollbar::-webkit-scrollbar-track {
          background: linear-gradient(180deg, #f8f9fa 0%, #fee2e2 50%, #f8f9fa 100%);
          border-radius: 10px;
        }
        
        .light-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #ef4444 0%, #dc2626 100%);
          border-radius: 10px;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 4px rgba(220,38,38,0.2);
        }
        
        @keyframes heistPulse {
          0%, 100% { 
            transform: scale(1);
            box-shadow: 0 0 20px rgba(220,38,38,0.3);
          }
          50% { 
            transform: scale(1.05);
            box-shadow: 0 0 30px rgba(220,38,38,0.6);
          }
        }
        
        .heist-pulse {
          animation: heistPulse 3s infinite;
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .fade-in-up {
          animation: fadeInUp 0.8s ease-out;
        }
        
        /* Mobile-first responsive typography */
        .mobile-text-xs { font-size: 0.75rem; }
        .mobile-text-sm { font-size: 0.875rem; }
        .mobile-text-base { font-size: 1rem; }
        .mobile-text-lg { font-size: 1.125rem; }
        .mobile-text-xl { font-size: 1.25rem; }
        .mobile-text-2xl { font-size: 1.5rem; }
        
        @media (min-width: 640px) {
          .mobile-text-xs { font-size: 0.75rem; }
          .mobile-text-sm { font-size: 0.875rem; }
          .mobile-text-base { font-size: 1rem; }
          .mobile-text-lg { font-size: 1.125rem; }
          .mobile-text-xl { font-size: 1.25rem; }
          .mobile-text-2xl { font-size: 1.5rem; }
        }
      `}</style>

      <div className={`min-h-screen transition-all duration-500 bg-gradient-to-br ${
        isDarkMode ? currentTheme.gradient : currentTheme.lightGradient
      } relative overflow-hidden`}>
        
        {/* Background Pattern */}
        <div className={`fixed inset-0 ${isDarkMode ? 'opacity-5' : 'opacity-20'} pointer-events-none`}>
          <div className="absolute top-4 left-4 sm:top-10 sm:left-10 text-3xl sm:text-6xl">🎭</div>
          <div className="absolute top-16 right-8 sm:top-32 sm:right-20 text-2xl sm:text-4xl">💰</div>
          <div className="absolute bottom-8 left-8 sm:bottom-20 sm:left-20 text-3xl sm:text-5xl">🔫</div>
          <div className="absolute bottom-20 right-4 sm:bottom-40 sm:right-10 text-xl sm:text-3xl">💎</div>
          <div className="absolute top-32 left-1/2 sm:top-60 text-2xl sm:text-4xl">🏛️</div>
        </div>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept=".pdf,image/*"
          className="hidden"
        />

        {/* Mobile Search Panel */}
        <MobileSearchPanel />

        {/* Mobile Chat History Panel */}
        <MobileChatHistoryPanel />

        {/* Desktop Search Panel */}
        {!isMobile && (
          <AnimatePresence>
            {showSearchPanel && (
              <motion.div
                initial={{ opacity: 0, x: 300 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 300 }}
                className={`fixed right-0 top-0 h-full w-80 xl:w-96 z-50 ${
                  isDarkMode 
                    ? 'bg-gray-900/95 border-l border-red-500/30' 
                    : 'bg-white/95 border-l border-red-300/40'
                } backdrop-blur-xl shadow-2xl`}
              >
                <div className="p-4 h-full flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className={`font-bold text-lg ${
                      isDarkMode ? 'text-red-400' : 'text-red-600'
                    }`}>
                      🔍 {t.searchHistory}
                    </h3>
                    <button
                      onClick={() => setShowSearchPanel(false)}
                      className="text-gray-500 hover:text-gray-700 p-1"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="mb-4">
                    <input
                      type="text"
                      placeholder={t.searchPlaceholder}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className={`w-full px-4 py-3 rounded-lg border text-sm ${
                        isDarkMode
                          ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400'
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                    />
                  </div>

                  <div className="flex-1 overflow-y-auto">
                    {isSearching && (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-500"></div>
                      </div>
                    )}

                    {searchResults.length > 0 && (
                      <div className="space-y-3">
                        <h4 className={`text-sm font-semibold ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          {searchResults.length} {t.resultsFound}
                        </h4>
                        
                        {searchResults.map((result, index) => (
                          <motion.div
                            key={`${result.chatId}-${result.messageId}`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={`p-3 rounded-lg cursor-pointer transition-all ${
                              isDarkMode 
                                ? 'bg-gray-800 hover:bg-gray-700 border border-red-500/20' 
                                : 'bg-gray-50 hover:bg-gray-100 border border-red-300/30'
                            }`}
                            onClick={() => {
                              const chat = chatHistory.find(c => c.id === result.chatId)
                              if (chat) {
                                setSelectedChatForView(chat)
                                setMessages(chat.messages)
                                setCurrentChatId(chat.id)
                                setShowSearchPanel(false)
                              }
                            }}
                          >
                            <div className="flex items-start space-x-2">
                              <span className="text-xs">
                                {result.message.isUser ? '👤' : currentPersona.emoji}
                              </span>
                              <div className="flex-1 min-w-0">
                                <div className={`text-xs font-medium mb-1 ${
                                  isDarkMode ? 'text-blue-300' : 'text-blue-600'
                                }`}>
                                  {result.chatTitle}
                                </div>
                                <p className={`text-xs ${
                                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                }`}>
                                  {result.snippet}...
                                </p>
                                <div className={`text-xs mt-1 ${
                                  isDarkMode ? 'text-gray-500' : 'text-gray-500'
                                }`}>
                                  {formatTimestamp(result.message.timestamp)}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}

                    {searchQuery && !isSearching && searchResults.length === 0 && (
                      <div className="text-center py-8">
                        <p className={`text-sm ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          {t.noResults} "{searchQuery}"
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {/* Desktop Chat History Panel */}
        {!isMobile && (
          <AnimatePresence>
            {showChatHistory && (
              <motion.div
                initial={{ opacity: 0, x: -300 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -300 }}
                className={`fixed left-0 top-0 h-full w-80 z-50 ${
                  isDarkMode 
                    ? 'bg-gray-900/95 border-r border-red-500/30' 
                    : 'bg-white/95 border-r border-red-300/40'
                } backdrop-blur-xl shadow-2xl`}
              >
                <div className="p-4 h-full flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className={`font-bold text-lg ${
                      isDarkMode ? 'text-red-400' : 'text-red-600'
                    }`}>
                      📚 {t.chatHistory}
                    </h3>
                    <button
                      onClick={() => setShowChatHistory(false)}
                      className="text-gray-500 hover:text-gray-700 p-1"
                    >
                      ✕
                    </button>
                  </div>

                  <button
                    onClick={newChat}
                    className="w-full mb-4 py-3 px-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl font-semibold"
                  >
                    ➕ New Chat
                  </button>

                  <div className="flex-1 overflow-y-auto space-y-2">
                    {chatHistory.map((chat) => (
                      <motion.div
                        key={chat.id}
                        whileHover={{ scale: 1.02 }}
                        className={`p-3 rounded-lg cursor-pointer transition-all ${
                          currentChatId === chat.id
                            ? 'bg-red-600 text-white'
                            : isDarkMode 
                            ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' 
                            : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                        }`}
                        onClick={() => {
                          setSelectedChatForView(chat)
                          setMessages(chat.messages)
                          setCurrentChatId(chat.id)
                          setShowChatHistory(false)
                        }}
                      >
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-sm">💬</span>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate text-sm">
                              {chat.title}
                            </div>
                          </div>
                        </div>
                        <div className="text-xs opacity-70">
                          {chat.messages.length} messages • {new Date(chat.lastActivity).toLocaleDateString()}
                        </div>
                      </motion.div>
                    ))}
                    
                    {chatHistory.length === 0 && (
                      <div className="text-center py-8">
                        <p className={`text-sm ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          {t.noChatHistory}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {/* Clear Chat Confirmation Dialog */}
        <AnimatePresence>
          {showClearConfirm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className={`max-w-sm w-full p-6 rounded-2xl ${
                  isDarkMode 
                    ? 'bg-gray-900 border border-red-500/50 text-white' 
                    : 'bg-white border border-red-400/50 text-gray-900 shadow-2xl'
                }`}
              >
                <h3 className={`font-bold text-lg mb-4 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
                  🔄 {t.clearChat}
                </h3>
                <p className="mb-6 text-sm">{t.clearConfirm}</p>
                <div className={`p-3 rounded-lg mb-6 ${
                  isDarkMode ? 'bg-yellow-900/20 border-yellow-500/50' : 'bg-yellow-50 border-yellow-400/50'
                } border`}>
                  <div className="flex items-center space-x-2">
                    <span className="text-yellow-500">💡</span>
                    <span className="text-xs">Your chat will still be saved in history for future reference.</span>
                  </div>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    className={`flex-1 py-3 px-4 rounded-xl border transition ${
                      isDarkMode 
                        ? 'border-gray-600 text-gray-300 hover:bg-gray-800' 
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={clearCurrentChat}
                    className="flex-1 py-3 px-4 bg-orange-600 hover:bg-orange-700 text-white rounded-xl transition font-semibold"
                  >
                    🔄 Clear
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* XP Gain Animation */}
        <AnimatePresence>
          {showXPGain && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.5 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.5 }}
              className="fixed top-20 sm:top-24 right-2 sm:right-4 z-50 bg-gradient-to-r from-red-500 to-red-600 text-white px-3 sm:px-4 py-2 rounded-full shadow-lg flex items-center space-x-2 border-2 border-yellow-400"
            >
              <span className="text-sm">⭐</span>
              <span className="font-bold text-sm">+{showXPGain} XP</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Level Up Animation */}
        <AnimatePresence>
          {showLevelUp && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
            >
              <div className="bg-gradient-to-r from-red-600 via-yellow-500 to-red-600 text-white p-6 sm:p-8 rounded-2xl shadow-2xl text-center border-4 border-yellow-400 max-w-sm w-full">
                <div className="text-4xl sm:text-6xl mb-4 heist-pulse">🏆</div>
                <h2 className="text-2xl sm:text-3xl font-bold mb-2">¡{t.levelUp}!</h2>
                <p className="text-lg sm:text-xl">{t.reachedLevel} {userProgress.level}!</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* API Error Alert */}
        <AnimatePresence>
          {apiError && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-4 left-2 right-2 sm:left-4 sm:right-4 z-50 max-w-md mx-auto"
            >
              <div className="backdrop-blur-lg bg-red-600/90 border-2 border-yellow-400 rounded-lg p-4 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">⚠️</span>
                    <span className="font-medium text-sm">{apiError}</span>
                  </div>
                  <button
                    onClick={() => setApiError(null)}
                    className="text-white hover:bg-white/20 p-1 rounded"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Enhanced Responsive Header */}
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`backdrop-blur-xl sticky top-0 z-40 ${
            isDarkMode 
              ? 'bg-black/40 border-b border-red-500/30' 
              : 'bg-white/90 border-b border-red-300/50 shadow-sm'
          }`}
        >
          <div className="max-w-6xl mx-auto px-2 sm:px-4 py-2 sm:py-4">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="w-8 h-8 sm:w-12 sm:h-12 bg-gradient-to-r from-red-600 to-red-700 rounded-full flex items-center justify-center border-2 border-yellow-400 heist-pulse">
                  <span className="text-white font-bold text-sm sm:text-xl">{currentTheme.emoji}</span>
                </div>
                <div>
                  <h1 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-red-500 via-yellow-400 to-red-500 bg-clip-text text-transparent">
                    El Profesor AI
                  </h1>
                  <div className="flex items-center space-x-2 sm:space-x-3 text-xs sm:text-sm">
                    <span className="bg-red-600 px-2 py-1 rounded text-xs font-bold text-white">
                      {t.level} {userProgress.level}
                    </span>
                    <div className="flex items-center space-x-1 bg-yellow-600 px-2 py-1 rounded text-xs font-bold text-black">
                      <span className="text-xs">⭐</span>
                      <span>{userProgress.totalXP.toLocaleString()} XP</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-1 sm:space-x-2">
                {/* Mobile Menu Button */}
                {isMobile && (
                  <button
                    onClick={() => setShowMobileMenu(!showMobileMenu)}
                    className={`p-2 rounded-lg border-2 transition-all duration-300 ${
                      showMobileMenu
                        ? 'bg-red-600 text-white border-yellow-400'
                        : isDarkMode
                        ? 'border-red-500/50 text-gray-300 hover:border-red-400'
                        : 'border-red-400/50 text-gray-700 hover:border-red-500'
                    }`}
                  >
                    <span className="text-sm">☰</span>
                  </button>
                )}

                {/* Desktop Controls */}
                {!isMobile && (
                  <>
                    {/* Chat History Button */}
                    <button
                      onClick={() => setShowChatHistory(!showChatHistory)}
                      className={`p-2 rounded-lg border-2 transition-all duration-300 ${
                        showChatHistory
                          ? 'bg-red-600 text-white border-yellow-400'
                          : isDarkMode
                          ? 'border-purple-500/50 text-purple-300 hover:border-purple-400'
                          : 'border-purple-400/60 text-purple-700 hover:border-purple-500'
                      }`}
                      title="Chat History"
                    >
                      <span className="text-sm">📚</span>
                      {chatHistory.length > 0 && (
                        <span className="ml-1 text-xs bg-purple-600 text-white rounded-full px-1 min-w-4 text-center">
                          {Math.min(chatHistory.length, 99)}
                        </span>
                      )}
                    </button>

                    {/* Search Button */}
                    <button
                      onClick={() => setShowSearchPanel(!showSearchPanel)}
                      className={`p-2 rounded-lg border-2 transition-all duration-300 ${
                        showSearchPanel
                          ? 'bg-red-600 text-white border-yellow-400'
                          : isDarkMode
                          ? 'border-blue-500/50 text-blue-300 hover:border-blue-400'
                          : 'border-blue-400/60 text-blue-700 hover:border-blue-500'
                      }`}
                      title="Search History"
                    >
                      <span className="text-sm">🔍</span>
                    </button>

                    {/* Clear Chat Button */}
                    <button
                      onClick={() => setShowClearConfirm(true)}
                      disabled={messages.length === 0}
                      className={`p-2 rounded-lg border-2 transition-all duration-300 ${
                        messages.length === 0
                          ? 'border-gray-500/30 text-gray-500 cursor-not-allowed'
                          : isDarkMode
                          ? 'border-orange-500/50 text-orange-300 hover:border-orange-400'
                          : 'border-orange-400/60 text-orange-700 hover:border-orange-500'
                      }`}
                      title="Clear Chat"
                    >
                      <span className="text-sm">🔄</span>
                    </button>

                    {/* Export PDF Button */}
                    <button
                      onClick={() => exportChatAsPDF(messages, currentPersona, currentLanguage, formatTimestamp, getCurrentChatTitle())}
                      disabled={messages.length === 0}
                      className={`p-2 rounded-lg border-2 transition-all duration-300 ${
                        messages.length === 0
                          ? 'border-gray-500/30 text-gray-500 cursor-not-allowed'
                          : isDarkMode
                          ? 'border-green-500/50 text-green-300 hover:border-green-400'
                          : 'border-green-400/60 text-green-700 hover:border-green-500'
                      }`}
                      title="Export as PDF"
                    >
                      <span className="text-sm">📥</span>
                    </button>

                    {/* Language Selector */}
                    <div className="relative">
                      <button
                        onClick={() => setShowSettings(!showSettings)}
                        className={`flex items-center space-x-1 p-2 rounded-lg border-2 transition-all duration-300 ${
                          isDarkMode
                            ? 'border-red-500/50 text-gray-300 hover:border-red-400'
                            : 'border-red-400/50 text-gray-700 hover:border-red-500'
                        }`}
                      >
                        <span className="text-sm">🌐</span>
                        <span className="text-sm">{currentLanguage.flag}</span>
                      </button>
                    </div>

                    {/* DeepThink Mode */}
                    <button
                      onClick={() => setDeepThinkMode(!deepThinkMode)}
                      className={`p-2 rounded-lg border-2 transition-all duration-300 ${
                        deepThinkMode 
                          ? 'bg-red-600 text-white border-yellow-400 shadow-lg' 
                          : isDarkMode
                          ? 'border-red-500/50 text-gray-300 hover:border-red-400'
                          : 'border-red-400/50 text-gray-700 hover:border-red-500'
                      }`}
                      title="DeepThink Mode"
                    >
                      <span className="text-sm">🧠</span>
                    </button>
                    
                    {/* Dark/Light Toggle */}
                    <button
                      onClick={() => setIsDarkMode(!isDarkMode)}
                      className={`p-2 rounded-lg border-2 transition-all duration-300 ${
                        isDarkMode
                          ? 'border-red-500/50 text-gray-300 hover:border-red-400'
                          : 'border-red-400/50 text-gray-700 hover:border-red-500'
                      }`}
                      title="Toggle Dark Mode"
                    >
                      <span className="text-sm">{isDarkMode ? '☀️' : '🌙'}</span>
                    </button>
                    
                    {/* Settings */}
                    <button
                      onClick={() => setShowSettings(!showSettings)}
                      className={`p-2 rounded-lg border-2 transition-all duration-300 ${
                        isDarkMode
                          ? 'border-red-500/50 text-gray-300 hover:border-red-400'
                          : 'border-red-400/50 text-gray-700 hover:border-red-500'
                      }`}
                      title="Settings"
                    >
                      <span className="text-sm">⚙️</span>
                    </button>
                  </>
                )}
              </div>
            </div>
            
            {/* Enhanced XP Progress Bar */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className={`flex-1 rounded-full h-2 sm:h-3 border ${
                isDarkMode 
                  ? 'bg-gray-800 border-red-500/30' 
                  : 'bg-white/80 border-red-400/30'
              }`}>
                <div 
                  className="bg-gradient-to-r from-red-500 to-yellow-500 h-full rounded-full transition-all duration-500 relative overflow-hidden"
                  style={{ width: `${progressPercentage}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                </div>
              </div>
              <span className={`text-xs font-bold ${
                isDarkMode ? 'text-yellow-400' : 'text-red-600'
              }`}>
                {currentXP}/{xpNeeded} XP
              </span>
            </div>
          </div>
        </motion.header>

        {/* Mobile Menu Dropdown */}
        <AnimatePresence>
          {isMobile && showMobileMenu && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`absolute top-full left-0 right-0 z-30 mx-2 mt-1 p-4 rounded-2xl ${
                isDarkMode ? 'bg-gray-900/95 border border-red-500/30' : 'bg-white/95 border border-red-300/40'
              } backdrop-blur-xl shadow-2xl`}
            >
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    setShowChatHistory(true)
                    setShowMobileMenu(false)
                  }}
                  className="flex flex-col items-center space-y-2 p-3 rounded-xl bg-purple-600/20 text-purple-300 hover:bg-purple-600/30 transition"
                >
                  <span className="text-lg">📚</span>
                  <span className="text-xs font-medium">History</span>
                </button>
                
                <button
                  onClick={() => {
                    setShowSearchPanel(true)
                    setShowMobileMenu(false)
                  }}
                  className="flex flex-col items-center space-y-2 p-3 rounded-xl bg-blue-600/20 text-blue-300 hover:bg-blue-600/30 transition"
                >
                  <span className="text-lg">🔍</span>
                  <span className="text-xs font-medium">Search</span>
                </button>
                
                <button
                  onClick={() => {
                    setShowClearConfirm(true)
                    setShowMobileMenu(false)
                  }}
                  disabled={messages.length === 0}
                  className="flex flex-col items-center space-y-2 p-3 rounded-xl bg-orange-600/20 text-orange-300 hover:bg-orange-600/30 transition disabled:opacity-50"
                >
                  <span className="text-lg">🔄</span>
                  <span className="text-xs font-medium">Clear</span>
                </button>
                
                <button
                  onClick={() => {
                    exportChatAsPDF(messages, currentPersona, currentLanguage, formatTimestamp, getCurrentChatTitle())
                    setShowMobileMenu(false)
                  }}
                  disabled={messages.length === 0}
                  className="flex flex-col items-center space-y-2 p-3 rounded-xl bg-green-600/20 text-green-300 hover:bg-green-600/30 transition disabled:opacity-50"
                >
                  <span className="text-lg">📥</span>
                  <span className="text-xs font-medium">Export</span>
                </button>
                
                <button
                  onClick={() => {
                    setDeepThinkMode(!deepThinkMode)
                    setShowMobileMenu(false)
                  }}
                  className={`flex flex-col items-center space-y-2 p-3 rounded-xl transition ${
                    deepThinkMode 
                      ? 'bg-red-600 text-white' 
                      : 'bg-red-600/20 text-red-300 hover:bg-red-600/30'
                  }`}
                >
                  <span className="text-lg">🧠</span>
                  <span className="text-xs font-medium">DeepThink</span>
                </button>
                
                <button
                  onClick={() => {
                    setIsDarkMode(!isDarkMode)
                    setShowMobileMenu(false)
                  }}
                  className="flex flex-col items-center space-y-2 p-3 rounded-xl bg-gray-600/20 text-gray-300 hover:bg-gray-600/30 transition"
                >
                  <span className="text-lg">{isDarkMode ? '☀️' : '🌙'}</span>
                  <span className="text-xs font-medium">Theme</span>
                </button>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-600/30">
                <button
                  onClick={() => {
                    setShowSettings(!showSettings)
                    setShowMobileMenu(false)
                  }}
                  className="w-full flex items-center justify-center space-x-2 p-3 rounded-xl bg-red-600/20 text-red-300 hover:bg-red-600/30 transition"
                >
                  <span className="text-lg">⚙️</span>
                  <span className="text-sm font-medium">Settings</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Enhanced Responsive Settings Panel */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className={`backdrop-blur-xl border-b overflow-hidden ${
                isDarkMode 
                  ? 'bg-black/50 border-red-500/30' 
                  : 'bg-white/90 border-red-300/50 shadow-sm'
              }`}
            >
              <div className="max-w-6xl mx-auto px-2 sm:px-4 py-4 sm:py-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
                  {/* Characters Section */}
                  <div>
                    <h3 className={`font-bold mb-4 sm:mb-6 text-lg sm:text-xl ${
                      isDarkMode ? 'text-red-400' : 'text-red-600'
                    }`}>
                      {t.personas} ({getUnlockedPersonas().length}/{personas.length})
                    </h3>
                    <div className="character-grid">
                      {personas.map((persona) => {
                        const isUnlocked = persona.unlockLevel <= userProgress.level
                        return (
                          <motion.div
                            key={persona.id}
                            whileHover={{ scale: isUnlocked ? 1.02 : 1 }}
                            className={`p-3 sm:p-4 rounded-xl border-2 transition-all duration-300 cursor-pointer ${
                              currentPersona.id === persona.id
                                ? 'bg-red-600 border-yellow-400 text-white shadow-lg'
                                : isUnlocked
                                ? isDarkMode
                                  ? 'bg-gray-800/50 border-red-500/50 text-gray-300 hover:border-red-400 hover:shadow-md'
                                  : 'bg-white/80 border-red-400/50 text-gray-700 hover:border-red-500 hover:shadow-md'
                                : isDarkMode
                                ? 'bg-gray-900/30 border-gray-600 text-gray-500'
                                : 'bg-gray-100/50 border-gray-400 text-gray-400'
                            }`}
                            onClick={() => {
                              if (isUnlocked) {
                                setCurrentPersona(persona)
                                localStorage.setItem('selectedPersona', persona.id)
                              }
                            }}
                          >
                            <div className="flex items-start space-x-2 sm:space-x-3">
                              <span className="text-2xl sm:text-3xl">{persona.emoji}</span>
                              <div className="flex-1 min-w-0">
                                <div className="font-bold text-base sm:text-lg">
                                  {persona.name[currentLanguage.code] || persona.name.en}
                                </div>
                                                              <div className="text-xs sm:text-sm opacity-70">{persona.realName}</div>
                                <div className="text-xs opacity-60 mb-1 sm:mb-2">
                                  {t.specialty}: {persona.specialty}
                                </div>
                                <div className="text-xs italic">
                                  "{persona.phrase[currentLanguage.code] || persona.phrase.en}"
                                </div>
                                {!isUnlocked && (
                                  <div className="mt-2">
                                    <span className="text-xs bg-gray-700 px-2 py-1 rounded">
                                      Unlock at Level {persona.unlockLevel}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        )
                      })}
                    </div>
                  </div>
                  
                  {/* Themes and Stats Section */}
                  <div className="space-y-6 sm:space-y-8">
                    {/* Themes */}
                    <div>
                      <h3 className={`font-bold mb-4 sm:mb-6 text-lg sm:text-xl ${
                        isDarkMode ? 'text-red-400' : 'text-red-600'
                      }`}>
                        {t.themes} ({getUnlockedThemes().length}/{themes.length})
                      </h3>
                      <div className="theme-grid">
                        {themes.map((theme) => {
                          const isUnlocked = theme.unlockLevel <= userProgress.level
                          return (
                            <motion.div
                              key={theme.id}
                              whileHover={{ scale: isUnlocked ? 1.02 : 1 }}
                              className={`p-3 sm:p-4 rounded-xl border-2 transition-all duration-300 cursor-pointer ${
                                currentTheme.id === theme.id
                                  ? 'bg-red-600 border-yellow-400 text-white shadow-lg'
                                  : isUnlocked
                                  ? isDarkMode
                                    ? 'bg-gray-800/50 border-red-500/50 text-gray-300 hover:border-red-400'
                                    : 'bg-white/80 border-red-400/50 text-gray-700 hover:border-red-500'
                                  : isDarkMode
                                  ? 'bg-gray-900/30 border-gray-600 text-gray-500'
                                  : 'bg-gray-100/50 border-gray-400 text-gray-400'
                              }`}
                              onClick={() => {
                                if (isUnlocked) {
                                  setCurrentTheme(theme)
                                  localStorage.setItem('selectedTheme', theme.id)
                                }
                              }}
                            >
                              <div className="text-center">
                                <div className="text-xl sm:text-2xl mb-2">{theme.emoji}</div>
                                <div className="font-bold text-sm">{theme.name}</div>
                                <div className="text-xs opacity-70">{theme.spanishName}</div>
                                {!isUnlocked && (
                                  <div className="mt-2">
                                    <span className="text-xs bg-gray-700 px-2 py-1 rounded">
                                      Lv.{theme.unlockLevel}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )
                        })}
                      </div>
                    </div>
                    
                    {/* Statistics */}
                    <div>
                      <h3 className={`font-bold mb-4 sm:mb-6 text-lg sm:text-xl ${
                        isDarkMode ? 'text-red-400' : 'text-red-600'
                      }`}>
                        {t.statistics}
                      </h3>
                      <div className="space-y-4">
                        <div className={`p-4 sm:p-6 rounded-xl border ${
                          isDarkMode 
                            ? 'bg-gray-800/50 border-red-500/30' 
                            : 'bg-white/90 border-red-400/40 shadow-sm'
                        }`}>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="text-center">
                              <div className={`text-xl sm:text-2xl font-bold ${
                                isDarkMode ? 'text-yellow-400' : 'text-red-600'
                              }`}>
                                {userProgress.messagesCount}
                              </div>
                              <div className={`text-xs sm:text-sm ${
                                isDarkMode ? 'text-gray-300' : 'text-gray-700'
                              }`}>
                                {t.messagesSent}
                              </div>
                            </div>
                            <div className="text-center">
                              <div className={`text-xl sm:text-2xl font-bold ${
                                isDarkMode ? 'text-yellow-400' : 'text-red-600'
                              }`}>
                                {userProgress.deepThinkUsage}
                              </div>
                              <div className={`text-xs sm:text-sm ${
                                isDarkMode ? 'text-gray-300' : 'text-gray-700'
                              }`}>
                                {t.deepThinkUsed}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Current Character Info */}
                        <div className={`p-4 sm:p-6 rounded-xl border ${
                          isDarkMode 
                            ? 'bg-red-600/20 border-red-400' 
                            : 'bg-red-50/90 border-red-400 shadow-sm'
                        }`}>
                          <div className="text-center">
                            <div className="text-3xl sm:text-4xl mb-3">{currentPersona.emoji}</div>
                            <div className={`font-bold text-base sm:text-lg ${
                              isDarkMode ? 'text-white' : 'text-red-800'
                            }`}>
                              {currentPersona.name[currentLanguage.code] || currentPersona.name.en}
                            </div>
                            <div className={`text-sm ${
                              isDarkMode ? 'text-gray-300' : 'text-red-600'
                            }`}>
                              {currentPersona.realName}
                            </div>
                            <div className={`text-xs mt-2 ${
                              isDarkMode ? 'text-gray-400' : 'text-red-700'
                            }`}>
                              {currentPersona.specialty}
                            </div>
                            <div className={`text-xs italic mt-3 ${
                              isDarkMode ? 'text-yellow-300' : 'text-red-700'
                            }`}>
                              "{currentPersona.phrase[currentLanguage.code] || currentPersona.phrase.en}"
                            </div>
                          </div>
                        </div>

                        {/* Language Selection */}
                        <div className={`p-4 sm:p-6 rounded-xl border ${
                          isDarkMode 
                            ? 'bg-blue-600/20 border-blue-400' 
                            : 'bg-blue-50/90 border-blue-400 shadow-sm'
                        }`}>
                          <div className="text-center mb-4">
                            <div className="text-2xl mb-2">🌐</div>
                            <div className={`font-bold ${
                              isDarkMode ? 'text-white' : 'text-blue-800'
                            }`}>
                              Language
                            </div>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {languages.map((lang) => (
                              <button
                                key={lang.code}
                                onClick={() => handleLanguageChange(lang.code)}
                                className={`p-2 sm:p-3 rounded-lg transition-all duration-200 text-xs sm:text-sm ${
                                  currentLanguage.code === lang.code
                                    ? 'bg-blue-600 text-white'
                                    : isDarkMode
                                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                    : 'bg-white text-gray-700 hover:bg-blue-50'
                                }`}
                              >
                                <div className="flex flex-col items-center space-y-1">
                                  <span className="text-lg">{lang.flag}</span>
                                  <span className="font-medium">{lang.nativeName}</span>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Chat Info */}
                        <div className={`p-4 sm:p-6 rounded-xl border ${
                          isDarkMode 
                            ? 'bg-green-600/20 border-green-400' 
                            : 'bg-green-50/90 border-green-400 shadow-sm'
                        }`}>
                          <div className="text-center">
                            <div className="text-2xl mb-2">💬</div>
                            <div className={`font-bold ${
                              isDarkMode ? 'text-white' : 'text-green-800'
                            }`}>
                              Current Chat
                            </div>
                            <div className={`text-sm ${
                              isDarkMode ? 'text-green-300' : 'text-green-700'
                            }`}>
                              {messages.length} messages
                            </div>
                            <div className={`text-xs mt-2 ${
                              isDarkMode ? 'text-green-400' : 'text-green-600'
                            }`}>
                              Total chats: {chatHistory.length}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Enhanced Messages Area - Fully Responsive */}
        <div className="flex-1 overflow-hidden">
          <div className="max-w-4xl mx-auto h-full flex flex-col">
            {/* Messages Container */}
            <div 
              ref={chatContainerRef}
              className={`flex-1 overflow-y-auto px-2 py-4 sm:px-4 sm:py-6 md:py-8 ${
                isDarkMode ? 'custom-scrollbar' : 'light-scrollbar'
              }`}
              style={{ paddingBottom: isMobile ? '120px' : '140px' }}
            >
              <AnimatePresence>
                {messages.map((message, index) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="message-spacing"
                  >
                    {message.isUser ? (
                      <div className="flex justify-end">
                        <div className="perplexity-user-message text-white">
                          <p className="leading-relaxed text-sm sm:text-base">{message.text}</p>
                          
                          {message.hasAttachment && (
                            <div className="mt-3 sm:mt-4 pt-3 border-t border-white/20">
                              {message.imagePreview ? (
                                <div className="rounded-lg overflow-hidden">
                                  <img 
                                    src={message.imagePreview} 
                                    alt={message.attachmentName}
                                    className="w-full h-auto max-h-32 sm:max-h-48 object-cover"
                                  />
                                  <div className="p-2 bg-black/20">
                                    <div className="flex items-center space-x-2 text-xs opacity-90">
                                      <span>🖼️</span>
                                      <span>{message.attachmentName}</span>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center space-x-2 text-xs opacity-90">
                                  <span>📄</span>
                                  <span>{message.attachmentName}</span>
                                </div>
                              )}
                            </div>
                          )}
                          
                          <div className="text-xs mt-3 opacity-70 text-right">
                            {formatTimestamp(message.timestamp)}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-start">
                        <div className={isDarkMode ? 'perplexity-ai-message text-white' : 'perplexity-light-ai-message text-gray-800'}>
                          <div className={`flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4 pb-3 border-b ${
                            isDarkMode ? 'border-red-500/30' : 'border-red-400/30'
                          }`}>
                            <span className="text-xl sm:text-2xl">
                              {personas.find(p => p.id === message.persona)?.emoji || currentPersona.emoji}
                            </span>
                            <div>
                              <div className={`font-bold text-sm sm:text-base ${
                                isDarkMode ? 'text-yellow-400' : 'text-red-600'
                              }`}>
                                {currentPersona.name[currentLanguage.code] || currentPersona.name.en}
                              </div>
                              <div className={`text-xs ${
                                isDarkMode ? 'text-gray-400' : 'text-gray-600'
                              }`}>
                                {currentPersona.realName} • {currentPersona.specialty}
                              </div>
                            </div>
                          </div>
                          
                          <RichTextRenderer text={message.text} isDark={isDarkMode} />
                          
                          <div className={`text-xs mt-4 pt-2 border-t border-white/10 ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            {formatTimestamp(message.timestamp)}
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {/* Typing Indicator */}
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className={isDarkMode ? 'perplexity-ai-message text-white' : 'perplexity-light-ai-message text-gray-800'}>
                    <div className="flex items-center space-x-3">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      <span className={`text-xs sm:text-sm font-medium ${
                        isDarkMode ? 'text-yellow-400' : 'text-red-600'
                      }`}>
                        {currentPersona.name[currentLanguage.code] || currentPersona.name.en} {t.thinking}
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}
              
              {/* Welcome Message */}
              {messages.length === 0 && (
                <div className="text-center py-12 sm:py-20 fade-in-up">
                  <div className="w-16 h-16 sm:w-24 sm:h-24 bg-gradient-to-r from-red-600 to-red-700 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 border-4 border-yellow-400 heist-pulse shadow-2xl">
                    <span className="text-white text-2xl sm:text-4xl">{currentPersona.emoji}</span>
                  </div>
                  <h2 className={`text-xl sm:text-3xl font-bold mb-2 sm:mb-3 ${
                    isDarkMode ? 'text-white' : 'text-gray-800'
                  }`}>
                    {t.welcomeTitle}
                  </h2>
                  <p className={`text-base sm:text-lg mb-2 ${
                    isDarkMode ? 'text-yellow-300' : 'text-red-600'
                  }`}>
                    {t.startConversation} {currentPersona.name[currentLanguage.code] || currentPersona.name.en}
                  </p>
                  <p className={`italic text-sm ${
                    isDarkMode ? 'text-red-400' : 'text-red-700'
                  }`}>
                    "{currentPersona.phrase[currentLanguage.code] || currentPersona.phrase.en}"
                  </p>
                  
                  {/* Quick Start Cards */}
                  <div className="mt-6 sm:mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 max-w-2xl mx-auto px-4">
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className={`p-3 sm:p-4 rounded-lg border cursor-pointer ${
                        isDarkMode
                          ? 'bg-gray-800/50 border-red-500/30 hover:border-red-400'
                          : 'bg-white/70 border-red-300/50 hover:border-red-500'
                      }`}
                      onClick={() => setInputText("What's your best strategy for planning?")}
                    >
                      <div className="text-xl sm:text-2xl mb-2">🧠</div>
                      <div className={`font-semibold text-sm sm:text-base ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                        Strategic Planning
                      </div>
                      <div className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Get insights on planning and strategy
                      </div>
                    </motion.div>
                    
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className={`p-3 sm:p-4 rounded-lg border cursor-pointer ${
                        isDarkMode
                          ? 'bg-gray-800/50 border-red-500/30 hover:border-red-400'
                          : 'bg-white/70 border-red-300/50 hover:border-red-500'
                      }`}
                      onClick={() => setInputText("Tell me about the heist philosophy")}
                    >
                      <div className="text-xl sm:text-2xl mb-2">💰</div>
                      <div className={`font-semibold text-sm sm:text-base ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                        Heist Philosophy
                      </div>
                      <div className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Learn about resistance and philosophy
                      </div>
                    </motion.div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>

        {/* Enhanced Fully Responsive Input Area */}
        <div className="fixed bottom-0 left-0 right-0 z-30">
          <div className="max-w-4xl mx-auto p-2 sm:p-4">
            {/* File Upload Preview */}
            <AnimatePresence>
              {uploadedFile && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="mb-2 sm:mb-3"
                >
                  <div className={`rounded-xl border p-3 ${
                    isDarkMode 
                      ? 'bg-gray-800/90 border-gray-700' 
                      : 'bg-white/95 border-gray-300 shadow-sm'
                  }`}>
                    <div className="flex items-center justify-between">
                      {uploadedFile.preview ? (
                        <div className="flex items-center space-x-3">
                          <img 
                            src={uploadedFile.preview} 
                            alt={uploadedFile.name}
                            className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg object-cover"
                          />
                          <div>
                            <div className="font-medium text-xs sm:text-sm">{uploadedFile.name}</div>
                            <div className="text-xs opacity-70">
                              {(uploadedFile.size / 1024).toFixed(1)} KB
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-3">
                          <span className="text-blue-500 text-lg">📄</span>
                          <div>
                            <div className="font-medium text-xs sm:text-sm">{uploadedFile.name}</div>
                            <div className="text-xs opacity-70">
                              {(uploadedFile.size / 1024).toFixed(1)} KB
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <button
                        onClick={() => setUploadedFile(null)}
                        className="p-1 hover:bg-gray-200 rounded text-gray-500"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Main Input Container */}
            <div className={
              isDarkMode 
                ? 'perplexity-input-container' 
                : 'perplexity-light-input-container'
            }>
              <div className="flex items-end p-3 sm:p-4">
                {/* File Upload Button */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading || isTyping}
                  className={`mr-2 sm:mr-3 h-8 w-8 sm:h-10 sm:w-10 p-0 rounded-full flex items-center justify-center ${
                    isUploading ? 'animate-pulse' : ''
                  } ${
                    isDarkMode
                      ? 'text-gray-400 hover:text-white hover:bg-white/10'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                  }`}
                >
                  <span className="text-sm sm:text-base">📎</span>
                </button>

                {/* Text Input */}
                <div className="flex-1 mr-2 sm:mr-3">
                  <textarea
                    ref={inputRef}
                    value={inputText}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    placeholder={t.messageTo}
                    rows={1}
                    className={`w-full bg-transparent resize-none focus:outline-none text-sm sm:text-base leading-relaxed max-h-20 sm:max-h-32 ${
                      isDarkMode 
                        ? 'text-white placeholder-gray-400' 
                        : 'text-gray-800 placeholder-gray-500'
                    }`}
                    disabled={isTyping}
                  />
                </div>

                {/* Send Button */}
                <button
                  onClick={handleSendMessage}
                  disabled={(!inputText.trim() && !uploadedFile) || isTyping}
                  className="h-8 w-8 sm:h-10 sm:w-10 p-0 bg-red-600 hover:bg-red-700 text-white rounded-full transition-all duration-300 disabled:opacity-50 flex items-center justify-center"
                >
                  <span className="text-sm sm:text-base">➤</span>
                </button>
              </div>
              
              {/* Status Bar */}
              <div className="px-3 pb-3 sm:px-4 sm:pb-4">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2 sm:space-x-3 overflow-x-auto">
                    {deepThinkMode && (
                      <div className={`flex items-center space-x-1 px-2 py-1 rounded-full whitespace-nowrap ${
                        isDarkMode 
                          ? 'bg-red-600/20 text-red-300' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        <span className="text-xs">🧠</span>
                        <span className="text-xs">{t.deepThinkActive}</span>
                      </div>
                    )}
                    
                    <div className={`flex items-center space-x-1 px-2 py-1 rounded-full whitespace-nowrap ${
                      isDarkMode 
                        ? 'bg-green-600/20 text-green-300' 
                        : 'bg-green-100 text-green-700'
                    }`}>
                      <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-xs">Gemini 2.0</span>
                    </div>
                    
                    <div className={`flex items-center space-x-1 px-2 py-1 rounded-full whitespace-nowrap ${
                      isDarkMode 
                        ? 'bg-blue-600/20 text-blue-300' 
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      <span className="text-xs">{currentLanguage.flag}</span>
                      <span className="text-xs hidden sm:inline">{currentLanguage.nativeName}</span>
                    </div>

                    <div className={`flex items-center space-x-1 px-2 py-1 rounded-full whitespace-nowrap ${
                      isDarkMode 
                        ? 'bg-purple-600/20 text-purple-300' 
                        : 'bg-purple-100 text-purple-700'
                    }`}>
                      <span className="text-xs">{currentPersona.emoji}</span>
                      <span className="text-xs hidden sm:inline">{currentPersona.name[currentLanguage.code]}</span>
                    </div>
                  </div>
                  
                  <div className={`flex items-center space-x-2 ${
                    isDarkMode ? 'text-gray-500' : 'text-gray-600'
                  }`}>
                    <span className="hidden sm:inline text-xs">{t.supportedFiles}</span>
                    <div className="flex space-x-1">
                      <kbd className={`px-1 py-0.5 text-xs rounded ${
                        isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'
                      }`}>Ctrl</kbd>
                      <kbd className={`px-1 py-0.5 text-xs rounded ${
                        isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'
                      }`}>K</kbd>
                      <span className="text-xs hidden sm:inline">Search</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

