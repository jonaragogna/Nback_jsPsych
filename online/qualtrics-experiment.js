/* 
Qualtrics-adapted version of Vekteo (2021) N-back task
Original: https://github.com/vekteo/Nback_jsPsych
Adapted for Qualtrics integration by Jona Ragogna
Modifications: 
  - Task initializes into Qualtrics display container
  - Data is saved to Qualtrics embedded data fields instead of CSV download
  - Task auto-advances Qualtrics to next page on completion
*/

let nbackStimuli = {};
let instruction;
let timeline = [];
const buttonToPressForTarget = ["f","j"];
const trialStructure = { type: "html-keyboard-response" };
const subjectId = jsPsych.randomization.randomID(15);

if (level == 0) {
  instruction = language.instructions0back
} else if (level == 1) {
  instruction = language.instructions1back
} else if (level == 2) {
  instruction = language.instructions2back
} else if (level == 3) {
  instruction = language.instructions3back
}

const instructions = {
  type: "instructions",
  pages: [
      `<h1>${language.welcomePage.welcome}</h1><br><p>${language.welcomePage.clickNext}</p>`,
      `<p>${instruction.letter}</p><p>${instruction.yourTask1}</p><p>${instruction.yourTask2}</p><p>${language.generalInstruction.fastAndAccurate}</p>${instruction.image}<p>${language.generalInstruction.clickNext}</p>`
  ],
  show_clickable_nav: true,
  button_label_next: language.button.next,
  button_label_previous: language.button.previous
}
}
setArrays()

if (level === 0) {
    defineNullBack()
} else if (level === 1) {
    defineOneBack()
} else if (level === 2) {
    defineTwoBack()
} else if (level === 3) {
    defineThreeBack()
}

createBlocks(nbackStimuli.practiceList, nbackStimuli.stimuliPractice, level)
createBlocks(nbackStimuli.stimuliListFirstBlock, nbackStimuli.stimuliFirstBlock, level)
createBlocks(nbackStimuli.stimuliListSecondBlock, nbackStimuli.stimuliSecondBlock, level)

const feedbackCorrect = {
  ... trialStructure,
  stimulus: `<div style="font-size:40px; color: green">${language.feedback.correct}</div>`,
  choices: jsPsych.NO_KEYS,
  trial_duration: feedBackDuration,
  data: {test_part: 'feedback'}
}

const feedbackWrong = { ... feedbackCorrect, stimulus: `<div style="font-size:40px; color: red">${language.feedback.wrong}</div>` }
const feedbackNo = { ... feedbackCorrect, stimulus: `<div style="font-size:40px; color: red">${language.feedback.noResponse}</div>` }

const fixation = {
  ... trialStructure,
  stimulus: '<div style="font-size:30px;">+</div>',
  choices: jsPsych.NO_KEYS,
  trial_duration: fixationDuration,
  data: {test_part: 'fixation'}
}

const test = {
  ... trialStructure,
  stimulus: jsPsych.timelineVariable('stimulus'),
  choices: buttonToPressForTarget,
  data: jsPsych.timelineVariable('data'),
  trial_duration: letterDuration,
  stimulus_duration: letterDuration,
  on_finish: function(data){
    if (data.correct_response == "f" && data.key_press == 70){
        data.correct_rejection = 1;
    } else {
        data.correct_rejection = 0;
    }
    if (data.correct_response == "j" && data.key_press == 70){
        data.miss = 1;
    } else {
        data.miss = 0;
    }
    if (data.correct_response == "j" && data.key_press == 74){
        data.hit = 1;
    } else {
        data.hit = 0;
    }
    if (data.correct_response == "f" && data.key_press == 74){
        data.false_alarm = 1;
    } else {
        data.false_alarm = 0;
    }
  },
}

const feedBackC = {
  timeline: [feedbackCorrect],
  timeline_variables: feedbackCorrect.data,
    conditional_function: function () {
        let data = jsPsych.data.get().last(1).values()[0];
        return data.hit == 1 || data.correct_rejection == 1
    }
}

const feedBackW = {
  timeline: [feedbackWrong],
  timeline_variables: feedbackWrong.data,
    conditional_function: function () {
        let data = jsPsych.data.get().last(1).values()[0];
        return data.hit == 0 || data.correct_rejection == 0
    }
}

const feedBackN = {
    timeline: [feedbackNo],
    timeline_variables: feedbackNo.data,
      conditional_function: function () {
          let data = jsPsych.data.get().last(1).values()[0];
          return data.hit === 0 && data.correct_rejection === 0 && data.miss === 0 && data.false_alarm === 0
      }
  }

const timelineElementStructure = {
    repetitions: 1,
    randomize_order: false,
}

const practice = { ... timelineElementStructure, timeline_variables: nbackStimuli.stimuliPractice, timeline: [fixation, test, feedBackN, feedBackC, feedBackW] }
const firstBlock = { ... timelineElementStructure, timeline_variables: nbackStimuli.stimuliFirstBlock, timeline: [fixation, test] }
const secondBlock = { ... firstBlock, timeline_variables: nbackStimuli.stimuliSecondBlock }

const debriefBlock = {
  type: "html-keyboard-response",
  choices: jsPsych.NO_KEYS,
  stimulus: function() {
    let trials = jsPsych.data.get().filterCustom(function(trial){
      return (trial.block === 1 || trial.block === 2) && trial.test_part === "test";
  }); 
    let correct_trials = trials.filterCustom(function(trial){
      return trial.hit === 1 || trial.correct_rejection === 1;
  })
    let accuracy = Math.round(correct_trials.count()/trials.count() * 100);
    let rt = Math.round(correct_trials.select('rt').mean());

    return `
    <h2>${language.end.end}</h2>
    <p>${language.feedback.accuracy}${accuracy}${language.feedback.accuracy2}</p>
    <p>${language.feedback.rt}${rt}${language.feedback.rt2}</p>
    <p>${language.end.thankYou}</p>`;
  },
  trial_duration: 3000,
  on_finish: function(trial) { statCalculation(trial) }
};

jsPsych.data.addProperties({subject: subjectId});

const forcedWait = {
  type: "html-keyboard-response",
  stimulus: '<p style="font-size: 22px;">Please take a moment to make sure you understand the task.</p><p style="font-size: 22px;">The practice will begin in a few seconds.</p>',
  choices: jsPsych.NO_KEYS,
  trial_duration: 7000
};

timeline.push({type: "fullscreen", fullscreen_mode: true}, instructions, forcedWait, startPractice, practice, afterPractice, firstBlock, betweenBlockRest, ready, secondBlock, debriefBlock, {type: "fullscreen", fullscreen_mode: false});

/*************** QUALTRICS-SPECIFIC INITIALIZATION ***************/

jsPsych.init({
  timeline: timeline,
  display_element: 'display_stage',
  on_data_update: function() {
    let interactionData = jsPsych.data.getInteractionData()
    const interactionDataOfLastTrial = interactionData.filter({'trial': jsPsych.data.get().last(1).values()[0].trial_index}).values();
    if (interactionDataOfLastTrial) {
        jsPsych.data.get().last(1).values()[0].browser_events = JSON.stringify(interactionDataOfLastTrial)
    }
  },
  on_finish: function() {
    // Compute summary statistics from the test trials only (excluding practice)
    let trials = jsPsych.data.get().filterCustom(function(trial){
      return (trial.block === 1 || trial.block === 2) && trial.test_part === "test";
    });
    let hits = trials.filterCustom(function(trial){ return trial.hit === 1; }).count();
    let misses = trials.filterCustom(function(trial){ return trial.miss === 1; }).count();
    let false_alarms = trials.filterCustom(function(trial){ return trial.false_alarm === 1; }).count();
    let correct_rejections = trials.filterCustom(function(trial){ return trial.correct_rejection === 1; }).count();
    let total_trials = trials.count();
    let correct_trials = trials.filterCustom(function(trial){ return trial.hit === 1 || trial.correct_rejection === 1; });
    let accuracy = (correct_trials.count() / total_trials * 100).toFixed(2);
    let rt_mean = Math.round(correct_trials.select('rt').mean());
    let rt_median = Math.round(correct_trials.select('rt').median());
    
    // Compute d-prime (signal detection)
    let n_targets = hits + misses;
    let n_nontargets = false_alarms + correct_rejections;
    let hit_rate = hits / n_targets;
    let fa_rate = false_alarms / n_nontargets;
    // Apply log-linear correction to avoid infinity at extremes
    if (hit_rate === 1) hit_rate = (n_targets - 0.5) / n_targets;
    if (hit_rate === 0) hit_rate = 0.5 / n_targets;
    if (fa_rate === 1) fa_rate = (n_nontargets - 0.5) / n_nontargets;
    if (fa_rate === 0) fa_rate = 0.5 / n_nontargets;
    
    // Inverse normal approximation (Beasley-Springer-Moro)
    function normInv(p) {
      let a1 = -3.969683028665376e+01, a2 = 2.209460984245205e+02, a3 = -2.759285104469687e+02;
      let a4 = 1.383577518672690e+02, a5 = -3.066479806614716e+01, a6 = 2.506628277459239e+00;
      let b1 = -5.447609879822406e+01, b2 = 1.615858368580409e+02, b3 = -1.556989798598866e+02;
      let b4 = 6.680131188771972e+01, b5 = -1.328068155288572e+01;
      let c1 = -7.784894002430293e-03, c2 = -3.223964580411365e-01, c3 = -2.400758277161838e+00;
      let c4 = -2.549732539343734e+00, c5 = 4.374664141464968e+00, c6 = 2.938163982698783e+00;
      let d1 = 7.784695709041462e-03, d2 = 3.224671290700398e-01, d3 = 2.445134137142996e+00;
      let d4 = 3.754408661907416e+00;
      let pLow = 0.02425, pHigh = 1 - pLow;
      let q, r;
      if (p < pLow) {
        q = Math.sqrt(-2 * Math.log(p));
        return (((((c1*q+c2)*q+c3)*q+c4)*q+c5)*q+c6) / ((((d1*q+d2)*q+d3)*q+d4)*q+1);
      } else if (p <= pHigh) {
        q = p - 0.5; r = q*q;
        return (((((a1*r+a2)*r+a3)*r+a4)*r+a5)*r+a6)*q / (((((b1*r+b2)*r+b3)*r+b4)*r+b5)*r+1);
      } else {
        q = Math.sqrt(-2 * Math.log(1-p));
        return -(((((c1*q+c2)*q+c3)*q+c4)*q+c5)*q+c6) / ((((d1*q+d2)*q+d3)*q+d4)*q+1);
      }
    }
    let dprime = (normInv(hit_rate) - normInv(fa_rate)).toFixed(3);

    // Save to Qualtrics embedded data fields
    Qualtrics.SurveyEngine.setEmbeddedData('nback_accuracy', accuracy);
    Qualtrics.SurveyEngine.setEmbeddedData('nback_dprime', dprime);
    Qualtrics.SurveyEngine.setEmbeddedData('nback_rt_mean', rt_mean);
    Qualtrics.SurveyEngine.setEmbeddedData('nback_rt_median', rt_median);
    Qualtrics.SurveyEngine.setEmbeddedData('nback_hits', hits);
    Qualtrics.SurveyEngine.setEmbeddedData('nback_misses', misses);
    Qualtrics.SurveyEngine.setEmbeddedData('nback_false_alarms', false_alarms);
    Qualtrics.SurveyEngine.setEmbeddedData('nback_correct_rejections', correct_rejections);
    Qualtrics.SurveyEngine.setEmbeddedData('nback_total_trials', total_trials);
    Qualtrics.SurveyEngine.setEmbeddedData('nback_subject_id', subjectId);
    
    // Save full trial-by-trial data as JSON string (optional, for detailed analysis)
    Qualtrics.SurveyEngine.setEmbeddedData('nback_full_data', jsPsych.data.get().json());

    // Clean up display and advance Qualtrics
    jQuery('#display_stage').remove();
    jQuery('#display_stage_background').remove();
    qthis.clickNextButton();
  }
});
