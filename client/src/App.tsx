import { Switch, Route, useLocation } from "wouter";
import { TrainingProvider, useTraining } from "@/lib/store";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Home from "@/pages/home";
import TopicView from "@/pages/topic";
import AdminDashboard from "@/pages/admin";
import ProgressOverview from "@/pages/progress";
import { useEffect } from "react";

function ProtectedRoute({ component: Component, ...rest }: any) {
  const { currentUser } = useTraining();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!currentUser) {
      setLocation('/login');
    }
  }, [currentUser, setLocation]);

  return currentUser ? <Component {...rest} /> : null;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/">
        {(params) => <ProtectedRoute component={Home} {...params} />}
      </Route>
      <Route path="/progress">
        {(params) => <ProtectedRoute component={ProgressOverview} {...params} />}
      </Route>
      <Route path="/topic/:id">
        {(params) => <ProtectedRoute component={TopicView} {...params} />}
      </Route>
      <Route path="/admin">
        {(params) => <ProtectedRoute component={AdminDashboard} {...params} />}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <TrainingProvider>
      <Toaster />
      <Router />
    </TrainingProvider>
  );
}

export default App;
