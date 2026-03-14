
import React, { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import ChatInterface from './components/ChatInterface';
import TeacherDashboard from './components/TeacherDashboard';
import { TeacherSettings } from './types';
import { BioStorage } from './services/storageService';

function App() {
  // Inicialização do estado a partir do Local Storage com proteção
  const [currentView, setCurrentView] = useState<'landing' | 'chat'>(() => {
    try {
      return (localStorage.getItem('telloo_current_view') as 'landing' | 'chat') || 'landing';
    } catch (e) {
      return 'landing';
    }
  });
  
  const [userName, setUserName] = useState(() => {
    try {
      return localStorage.getItem('telloo_user_name') || '';
    } catch (e) {
      return '';
    }
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const [teacherSettings, setTeacherSettings] = useState<TeacherSettings>(() => {
    try {
      const saved = localStorage.getItem('telloo_teacher_settings');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error("Erro ao carregar settings:", e);
    }
    return {
      isLoggedIn: false,
      currentChapter: '',
      keywords: '',
      gradeLevel: '1º Ano EM',
      enemMode: false,
      bnccFocus: true,
      pdfContent: '',
      pdfName: ''
    };
  });

  // Carregar conteúdo pesado do IndexedDB ao iniciar
  useEffect(() => {
    const loadLargeData = async () => {
      try {
        const content = await BioStorage.getLargeContent('current_pdf_content');
        if (content) {
          setTeacherSettings(prev => ({ ...prev, pdfContent: content }));
        }
      } catch (e) {
        console.error("Erro ao carregar conteúdo do IndexedDB:", e);
      }
    };
    loadLargeData();
  }, []);

  // Efeitos para persistir os dados sempre que mudarem
  useEffect(() => {
    try {
      localStorage.setItem('telloo_current_view', currentView);
    } catch (e) {}
  }, [currentView]);

  useEffect(() => {
    try {
      localStorage.setItem('telloo_user_name', userName);
    } catch (e) {}
  }, [userName]);

  useEffect(() => {
    try {
      // Salvar conteúdo pesado no IndexedDB
      if (teacherSettings.pdfContent) {
        BioStorage.saveLargeContent('current_pdf_content', teacherSettings.pdfContent);
      } else {
        BioStorage.clearLargeContent('current_pdf_content');
      }

      // Salvar o restante no localStorage (removendo o conteúdo pesado para não estourar limite)
      const { pdfContent, ...rest } = teacherSettings;
      localStorage.setItem('telloo_teacher_settings', JSON.stringify(rest));
    } catch (e) {
      console.error("Erro ao salvar configurações:", e);
    }
  }, [teacherSettings]);

  const handleEnter = (name: string) => {
    setUserName(name);
    setCurrentView('chat');
  };

  const handleLogout = () => {
    setUserName('');
    setCurrentView('landing');
    localStorage.removeItem('telloo_user_name');
    localStorage.removeItem('telloo_current_view');
    localStorage.removeItem('telloo_chat_history');
    localStorage.removeItem('telloo_current_topic');
  };

  return (
    <div className="font-sans text-white min-h-screen">
      {currentView === 'landing' ? (
        <LandingPage onEnter={handleEnter} />
      ) : (
        <>
          <ChatInterface 
            userName={userName} 
            settings={teacherSettings} 
            onOpenSettings={() => setIsSettingsOpen(true)}
            onLogout={handleLogout}
          />
          <TeacherDashboard 
            isOpen={isSettingsOpen} 
            setIsOpen={setIsSettingsOpen} 
            settings={teacherSettings} 
            onUpdate={setTeacherSettings} 
          />
        </>
      )}
    </div>
  );
}

export default App;
