import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { type CreateTaskDto, Priority, TaskStatus, type Task, type AITaskSuggestion } from '../types';

const validationSchema = Yup.object({
  title: Yup.string().required('Title is required').max(200),
  description: Yup.string().max(1000),
  status: Yup.number().required(),
  priority: Yup.number().required(),
  dueDate: Yup.string().nullable(),
});

interface TaskFormProps {
  initialData?: Task;
  aiSuggestion?: AITaskSuggestion;
  onSubmit: (values: CreateTaskDto) => Promise<void>;
  onCancel: () => void;
}

export default function TaskForm({ initialData, aiSuggestion, onSubmit, onCancel }: TaskFormProps) {
  const initialValues: CreateTaskDto = {
    title: initialData?.title || aiSuggestion?.title || '',
    description: initialData?.description || aiSuggestion?.description || '',
    status: initialData?.status ?? aiSuggestion?.status ?? TaskStatus.Todo,
    priority: initialData?.priority ?? aiSuggestion?.priority ?? Priority.Medium,
    dueDate: (initialData?.dueDate || aiSuggestion?.dueDate)?.split('T')[0] || '',
  };

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      enableReinitialize
      onSubmit={async (values, { setSubmitting }) => {
        await onSubmit(values);
        setSubmitting(false);
      }}
    >
      {({ isSubmitting }) => (
        <Form className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <Field
              type="text"
              name="title"
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <ErrorMessage name="title" component="div" className="text-red-500 text-xs mt-1" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <Field
              as="textarea"
              name="description"
              rows={3}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <Field
                as="select"
                name="status"
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={TaskStatus.Todo}>To Do</option>
                <option value={TaskStatus.InProgress}>In Progress</option>
                <option value={TaskStatus.InReview}>In Review</option>
                <option value={TaskStatus.Done}>Done</option>
              </Field>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Priority</label>
              <Field
                as="select"
                name="priority"
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={Priority.Low}>Low</option>
                <option value={Priority.Medium}>Medium</option>
                <option value={Priority.High}>High</option>
              </Field>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Due Date</label>
              <Field
                type="date"
                name="dueDate"
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : initialData ? 'Update Task' : 'Create Task'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-200 text-gray-800 py-2 rounded hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </Form>
      )}
    </Formik>
  );
}