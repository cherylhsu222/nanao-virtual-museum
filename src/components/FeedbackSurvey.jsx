import React from 'react';

const feedbackSurveyUrl = 'https://docs.google.com/forms/d/1ZcHawlq3JfaWnOuxGvbPLVrXAyfs7WsogBEKDj5cImk/viewform';

export default function FeedbackSurvey() {
  return <section id="feedback-survey" className="feedback-survey" aria-label="測試問卷">
    <div className="feedback-survey-shell">
      <span className="memory-contribution-kicker">測試問卷</span>
      <h2>謝謝您參與這趟南澳旅程</h2>
      <p>誠摯邀請您填寫測試問卷，<br />一同讓這座虛擬博物館更加完善。</p>
      <a href={feedbackSurveyUrl} target="_blank" rel="noreferrer">填寫測試問卷 ↗</a>
    </div>
  </section>;
}
