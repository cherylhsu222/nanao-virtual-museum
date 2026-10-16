import React, { useEffect, useState } from 'react';

const choices = [
  { label: '我第一次認識南澳泰雅族', screen: 0 },
  { label: '我知道一些，但想更深入了解', screen: 26.2 },
  { label: '我在這裡生活', screen: 59.2 },
];

export default function OpeningQuestions({ onContinue, onHome }) {
  const [choicesReady, setChoicesReady] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setReady(true));
    const timer = window.setTimeout(() => setChoicesReady(true), 6300);
    return () => { window.cancelAnimationFrame(frame); window.clearTimeout(timer); };
  }, []);

  return <section className={`opening-questions${ready ? ' is-visible' : ''}`} aria-labelledby="opening-question-title" aria-modal="true" role="dialog">
    <button className="return-home" type="button" onClick={onHome}><span aria-hidden="true">←</span> 返回首頁</button>
    <div className="opening-questions-wash" aria-hidden="true" />
    <div className="opening-questions-inner">
      <p className="opening-question opening-question-one">你知道南澳在哪裡嗎？</p>
      <p className="opening-question opening-question-two">你曾聽過南澳泰雅族嗎？</p>
      <p className="opening-question opening-question-three">你知道他們從哪裡來，<br />又為什麼會來到這裡嗎？</p>
      <div className="opening-question-final">
        <h1 id="opening-question-title">而你，對這裡知道多少？</h1>
        <div className="opening-question-choices" inert={!choicesReady} aria-hidden={!choicesReady}>
          <p>先選一個最接近你的答案</p>
          <div className="opening-question-choice-list">
            {choices.map(({ label, screen }) => <button key={label} type="button" onClick={() => onContinue(screen)}>{label}</button>)}
          </div>
        </div>
      </div>
    </div>
  </section>;
}
