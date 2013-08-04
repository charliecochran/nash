/*jslint browser: true, devel: true, eqeq: true, plusplus: true, sloppy: true */
/*global  jQuery,Handlebars*/

(function ($) {
	
	// Define things
	
	var CHORDS = {
			ROMAN: ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii'],
			ARABIC: ['1', '2', '3', '4', '5', '6', '7'],
			ARABIC_PLUS_TYPE: ['1', '2m', '3m', '4', '5', '6m', '7dim']
		},
		CHORDTYPES = { 1: 'Maj', 2: 'min', 3: 'min', 4: 'Maj', 5: 'Maj', 6: 'min', 7: 'dim' },
		dom = {},
		INTERVALS = { 1: 0, 2: 2, 3: 4, 4: 5, 5: 7, 6: 9, 7: 11 },
		NOTES = ['C', 'C#/Db', 'D', 'D#/Eb', 'E', 'F', 'F#/Gb', 'G', 'G#/Ab', 'A', 'A#/Bb', 'B'],
		pub = {},
		state = {
			bestStreak: 0,
			correctAnswer: null,
			key: 'random', // 'random' or number for NOTES index
			numberType: 'ROMAN', // ROMAN, ARABIC, ARABIC_PLUS_TYPE
			questionType: 'numToChord', // numToChord -> Number to Chord, chordToNum -> Chord to Number
			streak: 0
		},
		templates = {},
		TYPES = ['Maj', 'min', 'dim'];
	
	
	function getChordName(key, number) {
		return NOTES[(key + INTERVALS[number]) % NOTES.length] + ' ' + CHORDTYPES[number];
	}
	function getRandomChord() {
		var key = state.key == 'random' ? Math.floor(Math.random() * 12) : +state.key,
			number = Math.ceil(Math.random() * 7);
		return { key: key, number: number, name: getChordName(key, number) };
	}
	function showAnswersForCurrentQuestionType() {
		dom.answers.find('> div').hide();
		if (state.questionType == 'numToChord') {
			dom.chords.delay(200).fadeIn('slow');
		} else {
			dom[state.numberType.toLowerCase()].delay(200).fadeIn('slow');
		}
	}
	function transitionQuestions(newQuestionData) {
		var oldQ = dom.questions.find('.question'),
			newQ = $(templates.question(newQuestionData)).hide().appendTo(dom.questions);
		
		dom.answers.find('.incorrect').removeClass('incorrect');
		
		if (oldQ.length) {
			oldQ.fadeOut(400, function () {
				$(this).remove();
				newQ.fadeIn();
			});
		} else {
			newQ.fadeIn();
		}
	}
	function askNumToChord() {
		var data = { key: NOTES[state.correctAnswer.key], chord: CHORDS[state.numberType][state.correctAnswer.number - 1] };
		transitionQuestions(data);
	}
	function askChordToNum() {
		var data = { key: NOTES[state.correctAnswer.key], chord: state.correctAnswer.name };
		transitionQuestions(data);
	}
	function askQuestion() {
		state.correctAnswer = getRandomChord();
		if (state.questionType == 'numToChord') {
			askNumToChord();
		} else {
			askChordToNum();
		}
	}
	function showStreak() {
		dom.currentStreak.text(state.streak);
		dom.bestStreak.text(state.bestStreak);
	}
	function resetStreak() {
		state.streak = 0;
		showStreak();
	}
	function incrementStreak() {
		state.streak += 1;
		if (state.streak > state.bestStreak) {
			state.bestStreak = state.streak;
		}
		showStreak();
	}
	function checkLetterAnswer(answerNote, answerType) {
		var correctNote = NOTES[(state.correctAnswer.key + INTERVALS[state.correctAnswer.number]) % NOTES.length];
		return correctNote == NOTES[answerNote] && CHORDTYPES[state.correctAnswer.number] == TYPES[answerType];
	}
	function checkNumberAnswer(answerNumber) {
		return state.correctAnswer.number - 1 == answerNumber;
	}
	function checkAnswer(event) {
		var $answer = $(this);
		if ((state.questionType == 'numToChord' && checkLetterAnswer($answer.attr('nash-note'), $answer.attr('nash-type'))) ||
				(state.questionType == 'chordToNum' && checkNumberAnswer($answer.attr('nash-number')))) {
			// correct!
			dom.correct.finish().show().delay(500).fadeOut();
			dom.questions.find('.question').delay(500);
			incrementStreak();
			askQuestion();
		} else {
			// incorrect!
			dom.incorrect.finish().show().delay(300).fadeOut('slow');
			$(this).addClass('incorrect');
			resetStreak();
		}
		event.preventDefault();
	}
	
	// Setup
	
	function initTemplates() {
		templates.question = Handlebars.compile($('#question-template').html());
		templates.chordAnswer = Handlebars.compile($('#chord-answer-template').html());
		templates.numberAnswer = Handlebars.compile($('#number-answer-template').html());
	}
	function initAnswers() {
		var i;
		dom.answers = $('#answers');
		dom.chords = $('#chords').hide();
		dom.roman = $('#numbers-roman').hide();
		dom.arabic = $('#numbers-arabic').hide();
		dom.arabic_plus_type = $('#numbers-arabic-plus-type').hide();
		
		// Populate Chord answers
		for (i = 0; i < NOTES.length; i++) {
			$(templates.chordAnswer({ note: NOTES[i], number: i, types: TYPES })).appendTo(dom.chords);
		}
		
		// Populate Number answers
		for (i = 0; i < 7; i++) {
			// Roman
			$(templates.numberAnswer({ number: i, chord: CHORDS.ROMAN[i] })).appendTo(dom.roman);
			// Arabic
			$(templates.numberAnswer({ number: i, chord: CHORDS.ARABIC[i] })).appendTo(dom.arabic);
			// Arabic + Type
			$(templates.numberAnswer({ number: i, chord: CHORDS.ARABIC_PLUS_TYPE[i] })).appendTo(dom.arabic_plus_type);
		}
		
		dom.answers.on('click', '.answer:not(.incorrect)', checkAnswer);
		showAnswersForCurrentQuestionType();
		
	}
	function initOptions() {
		var i;
		dom.key = $('#key');
		dom.numberType = $('#numberType');
		dom.questionType = $('#questionType');
		
		for (i = 0; i < NOTES.length; i++) {
			$('<option value="' + i + '">' + NOTES[i] + '</option>').appendTo(dom.key);
		}
		
		dom.key.on('change', function () {
			state.key = $(this).val();
			askQuestion();
		});
		
		dom.numberType.on('change', function () {
			state.numberType = $(this).val();
			showAnswersForCurrentQuestionType();
			askQuestion();
		});
		
		dom.questionType.on('change', function () {
			state.questionType = $(this).val();
			showAnswersForCurrentQuestionType();
			askQuestion();
		});
	}
	function init() {
		dom.game = $('#nash');
		dom.questions = $('#questions');
		dom.correct = $('#correct').hide();
		dom.incorrect = $('#incorrect').hide();
		dom.currentStreak = $('#currentStreak');
		dom.bestStreak = $('#bestStreak');
		
		initTemplates();
		initOptions();
		initAnswers();
		askQuestion();
	}
	
	init();
}(jQuery));