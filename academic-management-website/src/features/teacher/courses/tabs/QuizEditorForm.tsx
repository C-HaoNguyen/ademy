import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { TeacherQuiz, TeacherQuizQuestion } from "@/shared/api/queries/useTeacherQuizQuery";
import Card from "@/shared/ui/Card";
import Button from "@/shared/ui/Button";
import FormField from "@/shared/ui/FormField";
import Input from "@/shared/ui/Input";

type EditableQuestion = TeacherQuizQuestion & { _key: string };

let keyCounter = 0;
const nextKey = () => `q-${keyCounter++}`;

const toEditable = (questions: TeacherQuizQuestion[]): EditableQuestion[] =>
    questions.map((q) => ({ ...q, _key: nextKey() }));

const emptyQuestion = (orderIndex: number): EditableQuestion => ({
    _key: nextKey(),
    questionText: "",
    orderIndex,
    choices: [
        { choiceText: "", isCorrect: true, orderIndex: 0 },
        { choiceText: "", isCorrect: false, orderIndex: 1 },
    ],
});

export interface QuizSavePayload {
    title: string;
    questions: {
        questionText: string;
        orderIndex: number;
        choices: { choiceText: string; isCorrect: boolean; orderIndex: number }[];
    }[];
}

interface QuizEditorFormProps {
    initialQuiz: TeacherQuiz | null;
    saving: boolean;
    onSubmit: (payload: QuizSavePayload) => void;
    onDelete?: () => void;
    deleting?: boolean;
}

const QuizEditorForm = ({ initialQuiz, saving, onSubmit, onDelete, deleting }: QuizEditorFormProps) => {
    const [title, setTitle] = useState(initialQuiz?.title ?? "");
    const [questions, setQuestions] = useState<EditableQuestion[]>(
        initialQuiz ? toEditable(initialQuiz.questions) : []
    );
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setTitle(initialQuiz?.title ?? "");
        setQuestions(initialQuiz ? toEditable(initialQuiz.questions) : []);
    }, [initialQuiz]);

    const addQuestion = () => setQuestions([...questions, emptyQuestion(questions.length)]);

    const removeQuestion = (key: string) => setQuestions(questions.filter((q) => q._key !== key));

    const updateQuestionText = (key: string, text: string) =>
        setQuestions(questions.map((q) => (q._key === key ? { ...q, questionText: text } : q)));

    const addChoice = (key: string) =>
        setQuestions(
            questions.map((q) =>
                q._key === key
                    ? { ...q, choices: [...q.choices, { choiceText: "", isCorrect: false, orderIndex: q.choices.length }] }
                    : q
            )
        );

    const removeChoice = (key: string, choiceIndex: number) =>
        setQuestions(
            questions.map((q) =>
                q._key === key ? { ...q, choices: q.choices.filter((_, i) => i !== choiceIndex) } : q
            )
        );

    const updateChoiceText = (key: string, choiceIndex: number, text: string) =>
        setQuestions(
            questions.map((q) =>
                q._key === key
                    ? {
                          ...q,
                          choices: q.choices.map((c, i) => (i === choiceIndex ? { ...c, choiceText: text } : c)),
                      }
                    : q
            )
        );

    const setCorrectChoice = (key: string, choiceIndex: number) =>
        setQuestions(
            questions.map((q) =>
                q._key === key
                    ? {
                          ...q,
                          choices: q.choices.map((c, i) => ({ ...c, isCorrect: i === choiceIndex })),
                      }
                    : q
            )
        );

    const handleSubmit = () => {
        if (!title.trim()) {
            setError("Tên bài kiểm tra không được để trống");
            return;
        }
        if (questions.length === 0) {
            setError("Cần ít nhất 1 câu hỏi");
            return;
        }
        for (const q of questions) {
            if (!q.questionText.trim()) {
                setError("Mỗi câu hỏi cần có nội dung");
                return;
            }
            if (q.choices.length < 2) {
                setError(`Câu hỏi "${q.questionText}" cần ít nhất 2 lựa chọn`);
                return;
            }
            if (!q.choices.some((c) => c.isCorrect)) {
                setError(`Câu hỏi "${q.questionText}" chưa có đáp án đúng`);
                return;
            }
            if (q.choices.some((c) => !c.choiceText.trim())) {
                setError(`Câu hỏi "${q.questionText}" có lựa chọn để trống`);
                return;
            }
        }
        setError(null);

        onSubmit({
            title,
            questions: questions.map((q, qIndex) => ({
                questionText: q.questionText,
                orderIndex: qIndex,
                choices: q.choices.map((c, cIndex) => ({
                    choiceText: c.choiceText,
                    isCorrect: c.isCorrect,
                    orderIndex: cIndex,
                })),
            })),
        });
    };

    return (
        <div className="space-y-4">
            <Card variant="app">
                <FormField label="Tên bài kiểm tra" required>
                    <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="VD: Bài test tổng kết" />
                </FormField>
            </Card>

            {questions.map((q, qIndex) => (
                <Card key={q._key} variant="app">
                    <div className="flex items-start justify-between gap-3 mb-3">
                        <span className="text-body-sm font-medium text-secondary shrink-0 mt-2.5">
                            Câu {qIndex + 1}
                        </span>
                        <Input
                            value={q.questionText}
                            onChange={(e) => updateQuestionText(q._key, e.target.value)}
                            placeholder="Nội dung câu hỏi"
                            className="flex-1"
                        />
                        <button
                            type="button"
                            onClick={() => removeQuestion(q._key)}
                            className="cursor-pointer p-2 rounded-radius-md text-status-danger-text hover:bg-status-danger-bg transition-colors shrink-0"
                            aria-label="Xóa câu hỏi"
                        >
                            <Trash2 size={16} aria-hidden="true" />
                        </button>
                    </div>

                    <div className="space-y-2 pl-8">
                        {q.choices.map((c, cIndex) => (
                            <div key={cIndex} className="flex items-center gap-2">
                                <input
                                    type="radio"
                                    name={`correct-${q._key}`}
                                    checked={c.isCorrect}
                                    onChange={() => setCorrectChoice(q._key, cIndex)}
                                    aria-label={`Đánh dấu lựa chọn ${cIndex + 1} là đáp án đúng`}
                                />
                                <Input
                                    value={c.choiceText}
                                    onChange={(e) => updateChoiceText(q._key, cIndex, e.target.value)}
                                    placeholder={`Lựa chọn ${cIndex + 1}`}
                                    className="flex-1"
                                />
                                <button
                                    type="button"
                                    onClick={() => removeChoice(q._key, cIndex)}
                                    disabled={q.choices.length <= 2}
                                    className="text-tertiary hover:text-status-danger-text disabled:opacity-30 disabled:cursor-not-allowed"
                                    aria-label="Xóa lựa chọn"
                                >
                                    <Trash2 size={14} aria-hidden="true" />
                                </button>
                            </div>
                        ))}
                        <Button variant="tertiary" size="sm" iconLeft={Plus} onClick={() => addChoice(q._key)}>
                            Thêm lựa chọn
                        </Button>
                    </div>
                </Card>
            ))}

            <Button variant="secondary" iconLeft={Plus} onClick={addQuestion}>
                Thêm câu hỏi
            </Button>

            {error && <p className="text-body-sm text-status-danger-text">{error}</p>}

            <div className="flex justify-between">
                {onDelete ? (
                    <Button variant="danger" loading={deleting} onClick={onDelete}>
                        Xóa quiz
                    </Button>
                ) : (
                    <span />
                )}
                <Button variant="primary" loading={saving} onClick={handleSubmit}>
                    Lưu
                </Button>
            </div>
        </div>
    );
};

export default QuizEditorForm;
