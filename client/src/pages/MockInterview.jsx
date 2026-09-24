import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  FiArrowLeft,
  FiArrowRight,
  FiCheckCircle,
  FiClock,
  FiMic,
  FiSquare,
} from "react-icons/fi";
import api from "../api/axios";
import "../App.css";

const readActiveInterview = (interviewId) => {
  try {
    const value = localStorage.getItem("activeInterview");
    const savedData = value ? JSON.parse(value) : null;
    return savedData?.interview?._id === interviewId ? savedData : null;
  } catch {
    return null;
  }
};

function MockInterview() {
  const { interviewId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const initialData =
    location.state?.interview?._id === interviewId
      ? location.state
      : readActiveInterview(interviewId);
  const [interviewData, setInterviewData] = useState(initialData);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(!initialData);
  const [answers, setAnswers] = useState({});
  const [savedAnswers, setSavedAnswers] = useState({});
  const [evaluations, setEvaluations] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState("");
  const [error, setError] = useState("");
  const recognitionRef = useRef(null);
  const speechBaseAnswerRef = useRef("");
  const speechFinalTranscriptRef = useRef("");

  useEffect(() => {
    if (interviewData) return;

    const loadInterview = async () => {
      try {
        const { data } = await api.get(`/interviews/${interviewId}`);
        const loadedData = { interview: data.interview, questions: data.questions };
        localStorage.setItem("activeInterview", JSON.stringify(loadedData));
        setInterviewData(loadedData);
      } catch (loadError) {
        setError(loadError.response?.data?.message || "Could not load this interview.");
      } finally {
        setIsLoading(false);
      }
    };

    loadInterview();
  }, [interviewData, interviewId]);

  useEffect(() => {
    const loadAnswers = async () => {
      try {
        const { data } = await api.get(`/answers/${interviewId}`);
        const answerMap = data.answers.reduce((result, item) => {
          result[item.questionId] = item.answer;
          return result;
        }, {});
        const evaluationMap = data.answers.reduce((result, item) => {
          if (item.evaluationStatus === "completed") result[item.questionId] = item;
          return result;
        }, {});
        setAnswers(answerMap);
        setSavedAnswers(answerMap);
        setEvaluations(evaluationMap);
      } catch (loadError) {
        setError(loadError.response?.data?.message || "Could not load your saved answers.");
      }
    };

    loadAnswers();
  }, [interviewId]);

  useEffect(() => () => {
    recognitionRef.current?.abort();
  }, []);

  if (isLoading) {
    return <main className="interview-room"><p className="interview-state">Loading interview...</p></main>;
  }

  if (error || !interviewData?.questions?.length) {
    return (
      <main className="interview-room">
        <section className="interview-state">
          <h1>Interview unavailable</h1>
          <p>{error || "No questions were found for this interview."}</p>
          <button onClick={() => navigate("/interview/setup")}>Create another interview</button>
        </section>
      </main>
    );
  }

  const { interview, questions } = interviewData;
  const currentQuestion = questions[currentIndex];
  const currentAnswer = answers[currentQuestion._id] || "";
  const currentEvaluation = evaluations[currentQuestion._id];
  const isCurrentAnswerSaved = savedAnswers[currentQuestion._id] === currentAnswer;
  const isLastQuestion = currentIndex === questions.length - 1;
  const progress = ((currentIndex + 1) / questions.length) * 100;

  const updateCurrentAnswer = (value) => {
    setAnswers((existingAnswers) => ({
      ...existingAnswers,
      [currentQuestion._id]: value,
    }));
    setEvaluations((existingEvaluations) => {
      const updatedEvaluations = { ...existingEvaluations };
      delete updatedEvaluations[currentQuestion._id];
      return updatedEvaluations;
    });
    setSaveMessage("");
  };

  const stopVoiceInput = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  const startVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechError("Voice input is not supported in this browser. Please use Chrome or Edge.");
      return;
    }

    setSpeechError("");
    setSaveMessage("");
    speechBaseAnswerRef.current = currentAnswer.trim();
    speechFinalTranscriptRef.current = "";

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = navigator.language || "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event) => {
      let interimTranscript = "";

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const transcript = event.results[index][0].transcript;
        if (event.results[index].isFinal) {
          speechFinalTranscriptRef.current += `${transcript.trim()} `;
        } else {
          interimTranscript += transcript;
        }
      }

      const combinedSpeech = `${speechFinalTranscriptRef.current}${interimTranscript}`.trim();
      const separator = speechBaseAnswerRef.current && combinedSpeech ? " " : "";
      updateCurrentAnswer(
        `${speechBaseAnswerRef.current}${separator}${combinedSpeech}`.slice(0, 5000)
      );
    };
    recognition.onerror = (event) => {
      const messages = {
        "not-allowed": "Microphone permission was denied. Allow microphone access and try again.",
        "audio-capture": "No working microphone was detected.",
        network: "Voice recognition needs an internet connection. Check your connection and try again.",
        "no-speech": "No speech was detected. Please try again.",
      };
      setSpeechError(messages[event.error] || "Voice input stopped unexpectedly. Please try again.");
      setIsListening(false);
    };
    recognition.onend = () => {
      recognitionRef.current = null;
      setIsListening(false);
    };

    try {
      recognition.start();
    } catch {
      setSpeechError("Voice input could not start. Please wait a moment and try again.");
      setIsListening(false);
    }
  };

  const saveCurrentAnswer = async () => {
    const normalizedAnswer = currentAnswer.trim();
    if (normalizedAnswer.length < 2) {
      setSaveMessage("Write an answer before continuing.");
      return false;
    }

    setIsSaving(true);
    setSaveMessage("");
    try {
      const { data } = await api.post(`/answers/${interviewId}`, {
        questionId: currentQuestion._id,
        answer: normalizedAnswer,
      });
      setAnswers((existingAnswers) => ({
        ...existingAnswers,
        [currentQuestion._id]: data.answer.answer,
      }));
      setSavedAnswers((existingAnswers) => ({
        ...existingAnswers,
        [currentQuestion._id]: data.answer.answer,
      }));
      setEvaluations((existingEvaluations) => ({
        ...existingEvaluations,
        [currentQuestion._id]: data.answer,
      }));
      return true;
    } catch (saveError) {
      setSaveMessage(saveError.response?.data?.message || "Could not save your answer.");
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleContinue = async () => {
    const wasSaved = await saveCurrentAnswer();
    if (!wasSaved) return;

    if (isLastQuestion) {
      setIsCompleting(true);
      try {
        const { data } = await api.post(`/answers/${interviewId}/complete`);
        localStorage.removeItem("activeInterview");
        navigate(`/interview/${interviewId}/report`, {
          state: { interview: data.interview, answers: data.answers, questions },
        });
      } catch (completionError) {
        setSaveMessage(
          completionError.response?.data?.message || "Could not complete this interview."
        );
      } finally {
        setIsCompleting(false);
      }
      return;
    }

    setCurrentIndex((index) => index + 1);
    setSpeechError("");
    setSaveMessage("");
  };

  return (
    <main className="interview-room">
      <header className="interview-room-header">
        <div>
          <p className="eyebrow">Mock interview</p>
          <h1>{interview.role}</h1>
        </div>
        <div className="interview-meta">
          <span>{interview.type}</span>
          <span>{interview.difficulty}</span>
          <span
            className={`source-badge ${
              interview.generationSource === "gemini" ? "gemini-source" : "local-source"
            }`}
          >
            {interview.generationSource === "gemini"
              ? "Source: Gemini AI"
              : "Source: Local fallback"}
          </span>
          <span><FiClock /> {questions.length} questions</span>
        </div>
      </header>

      <section className="question-panel">
        <div className="question-progress-heading">
          <span>Question {currentIndex + 1} of {questions.length}</span>
          <span>{Math.round(progress)}% complete</span>
        </div>
        <div className="question-progress-track">
          <div style={{ width: `${progress}%` }} />
        </div>

        <div className="question-labels">
          <span>{currentQuestion.type}</span>
          {currentQuestion.skill && <span>{currentQuestion.skill}</span>}
        </div>
        <h2>{currentQuestion.question}</h2>

        <div className="answer-field">
          <div className="answer-field-heading">
            <label htmlFor={`answer-${currentQuestion._id}`}>Your answer</label>
            <span>{currentAnswer.length}/5000</span>
          </div>
          <textarea
            id={`answer-${currentQuestion._id}`}
            value={currentAnswer}
            onChange={(event) => updateCurrentAnswer(event.target.value)}
            placeholder="Type your interview answer here..."
            maxLength="5000"
            rows="7"
            disabled={isSaving}
          />
          <div className="voice-answer-controls">
            <button
              type="button"
              className={`voice-button ${isListening ? "recording" : ""}`}
              onClick={isListening ? stopVoiceInput : startVoiceInput}
              disabled={isSaving}
            >
              {isListening ? <FiSquare /> : <FiMic />}
              {isListening ? "Stop voice input" : "Answer using microphone"}
            </button>
            {isListening && <span className="listening-indicator">Listening… speak now</span>}
          </div>
          {speechError && <p className="speech-error" role="alert">{speechError}</p>}
          <div className="answer-save-status" aria-live="polite">
            {saveMessage ? (
              <span className="answer-save-error">{saveMessage}</span>
            ) : isCurrentAnswerSaved && currentAnswer ? (
              <span className="answer-saved"><FiCheckCircle /> Answer saved</span>
            ) : (
              <span>Your answer is saved when you continue.</span>
            )}
          </div>
        </div>

        {currentEvaluation && (
          <section className="answer-evaluation" aria-live="polite">
            <div className="evaluation-heading">
              <div>
                <p className="eyebrow">Answer evaluation</p>
                <h3>Your feedback</h3>
              </div>
              <span className={`evaluation-source ${currentEvaluation.evaluationSource}`}>
                {currentEvaluation.evaluationSource === "gemini"
                  ? "Gemini AI evaluation"
                  : "Local evaluation"}
              </span>
            </div>

            <div className="evaluation-scores">
              {[
                ["Overall", currentEvaluation.scores.overall],
                ["Correctness", currentEvaluation.scores.correctness],
                ["Confidence", currentEvaluation.scores.confidence],
                ["Communication", currentEvaluation.scores.communication],
                ["Technical accuracy", currentEvaluation.scores.technicalAccuracy],
              ].map(([label, score]) => (
                <div className="evaluation-score" key={label}>
                  <strong>{score}</strong>
                  <span>{label}</span>
                </div>
              ))}
            </div>

            <div className="evaluation-feedback-grid">
              {[
                ["Strengths", currentEvaluation.strengths],
                ["Weaknesses", currentEvaluation.weaknesses],
                ["Suggestions", currentEvaluation.suggestions],
              ].map(([title, items]) => (
                <div className="evaluation-feedback" key={title}>
                  <h4>{title}</h4>
                  <ul>{items.map((item) => <li key={item}>{item}</li>)}</ul>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="question-navigation">
          <button
            className="secondary-button"
            onClick={() => {
              setCurrentIndex((index) => index - 1);
              setSpeechError("");
              setSaveMessage("");
            }}
            disabled={currentIndex === 0 || isSaving || isCompleting || isListening}
          >
            <FiArrowLeft /> Previous
          </button>

          {isLastQuestion ? (
            <button
              className="primary-button"
              onClick={handleContinue}
              disabled={isSaving || isCompleting || isListening}
            >
              <FiCheckCircle /> {isSaving || isCompleting ? "Preparing report..." : "Save and finish"}
            </button>
          ) : (
            <button
              className="primary-button"
              onClick={handleContinue}
              disabled={isSaving || isCompleting || isListening}
            >
              {isSaving ? "Saving..." : "Save and continue"} {!isSaving && <FiArrowRight />}
            </button>
          )}
        </div>
      </section>
    </main>
  );
}

export default MockInterview;
