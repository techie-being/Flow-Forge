
const classifyTask = (description) => {
    const text = description.toLowerCase();

    let taskType = "general";
    let priority = "medium";

    // Task type classification
    if (
        text.includes("summarize") ||
        text.includes("summary") ||
        text.includes("summarise")
    ) {
        taskType = "summarization";
    } else if (
        text.includes("extract") ||
        text.includes("extraction")
    ) {
        taskType = "data_extraction";
    } else if (
        text.includes("analyze") ||
        text.includes("analysis") ||
        text.includes("analyse")
    ) {
        taskType = "analysis";
    } else if (
        text.includes("translate") ||
        text.includes("translation")
    ) {
        taskType = "translation";
    } else if (
        text.includes("question") ||
        text.includes("answer")
    ) {
        taskType = "question_answering";
    }

    // Priority classification
    if (
        text.includes("urgent") ||
        text.includes("immediately") ||
        text.includes("as soon as possible")
    ) {
        priority = "high";
    } else if (
        text.includes("low priority") ||
        text.includes("not urgent")
    ) {
        priority = "low";
    }

    return {
        taskType,
        priority,
    };
};

export default classifyTask;
