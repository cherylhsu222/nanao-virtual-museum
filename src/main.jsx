import React, { useCallback, useEffect, useState } from 'react';
import {createRoot} from 'react-dom/client';
import NanaoScrollyMap from './components/NanaoScrollyMap.jsx';
import HomeHero from './components/HomeHero.jsx';
import OpeningQuestions from './components/OpeningQuestions.jsx';
import 'maplibre-gl/dist/maplibre-gl.css';
import './styles.css';
import './layout-overrides.css';
import './home.css';

function MuseumApp() {
  const [enteredMuseum, setEnteredMuseum] = useState(false);
  const [questionsOpen, setQuestionsOpen] = useState(false);
  const [entryScreen, setEntryScreen] = useState(0);
  const [visit, setVisit] = useState(0);
  const returnHome = useCallback(() => {
    setQuestionsOpen(false);
    setEnteredMuseum(false);
    setEntryScreen(0);
    setVisit(value => value + 1);
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    window.requestAnimationFrame(() => document.querySelector('.home-hero-cta')?.focus({ preventScroll: true }));
  }, []);
  const completeEntry = useCallback(() => {
    setEnteredMuseum(true);
    setQuestionsOpen(true);
  }, []);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    if (!enteredMuseum || questionsOpen) {
      document.body.style.overflow = 'hidden';
      if (!questionsOpen) window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      return () => { document.body.style.overflow = previousOverflow; };
    }

    document.body.style.overflow = '';
    const frame = window.requestAnimationFrame(() => {
      window.dispatchEvent(new Event('resize'));
    });
    return () => window.cancelAnimationFrame(frame);
  }, [enteredMuseum, questionsOpen]);

  return <>
    {!enteredMuseum && <HomeHero onEnterComplete={completeEntry} />}
    {questionsOpen && <OpeningQuestions onHome={returnHome} onContinue={screen => { setEntryScreen(screen); setQuestionsOpen(false); }} />}
    {enteredMuseum && !questionsOpen && <button className="return-home" type="button" onClick={returnHome}><span aria-hidden="true">←</span> 返回首頁</button>}
    <NanaoScrollyMap key={visit} entered={enteredMuseum && !questionsOpen} entryScreen={entryScreen} />
  </>;
}

createRoot(document.getElementById('root')).render(<React.StrictMode><MuseumApp /></React.StrictMode>);
