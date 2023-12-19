import TextEditor from "./TextEditor"
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Redirect,
} from "react-router-dom"
import { v4 as uuidV4 } from "uuid"
import RealtimeEditor from "./RealtimeVoice"

function App() {
  return (
    <Router>
      <Switch>
        <Route path="/dictation-beta" exact>
          <Redirect to={`/dictation-beta/documents/${uuidV4()}`} />
        </Route>
        <Route path="/dictation-beta/documents/:id">
          <TextEditor />
        </Route>
        <Route path="/dictation-beta/realtimeVoice">
          <RealtimeEditor />
        </Route>
      </Switch>
    </Router>
  )
}

export default App
