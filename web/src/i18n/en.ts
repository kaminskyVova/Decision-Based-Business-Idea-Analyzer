export const en = {
  gatekeeper: {
    title: "Decision-Based Business Idea Analyzer",

    fields: {
      problem: {
        label: "Problem",
        placeholder: "What is not working now? Context / example.",
      },
      goal: {
        label: "Goal",
        placeholder:
          "Purpose of the request: validate feasibility/relevance or achieve a specific outcome.",
      },
      region: {
        label: "Region",
        placeholder: "Country + region (+city for offline cases).",
      },
      capital: {
        label: "Capital",
        placeholder: "Example: 100000 / up to 200000 / 100k",
      },
      time_horizon: {
        label: "Time horizon",
        placeholder:
          "Optional for admission, but may help (e.g. 3 months)",
      },
    },

    checkboxes: {
      responsibility: "I take responsibility for decisions (required)",
      production: "Production case",
    },

    buttons: {
      precheck: "Data check",
      analysis: "Analysis",
    },

    states: {
      admitted: "Data ready (ADMITTED). Analysis enabled.",
      dirty: "Data changed — recheck required.",
      need_check: "Please run data check first.",
    },
  },
};
