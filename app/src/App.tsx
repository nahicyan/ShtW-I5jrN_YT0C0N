import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Layout from './components/layout/Layout';
import ProjectList from './components/projects/ProjectList';
import ProjectForm from './components/projects/ProjectForm';
import ProjectDetail from './components/projects/ProjectDetail';
import Tasks from './pages/Tasks';
import Budget from './pages/Budget';
import Schedule from './pages/Schedule';
import Dashboard from './pages/Dashboard';
import Questions from './pages/Questions';
import Questionnaires from './pages/Questionnaires';
import TaskTemplates from './pages/TaskTemplates';
import TaskSets from './pages/TaskSets';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="questions" element={<Questions />} />
            <Route path="questionnaires" element={<Questionnaires />} />
            <Route path="taskTemplates" element={<TaskTemplates />} />
            <Route path="taskSets" element={<TaskSets />} />
            <Route path="projects">
              <Route index element={<ProjectList />} />
              <Route path="new" element={<ProjectForm />} />
              <Route path=":id" element={<ProjectDetail />} />
              <Route path="edit/:id" element={<ProjectForm isEditing />} />
            </Route>
            <Route path="tasks">
              <Route index element={<Navigate to="/projects" replace />} />
              <Route path="project/:projectId" element={<Tasks />} />
            </Route>
            <Route path="schedule" element={<Schedule />} />
            <Route path="budget" element={<Budget />} />
            <Route path="*" element={<Navigate to="/projects" replace />} />
          </Route>
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;