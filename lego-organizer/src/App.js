import React from 'react';
import './App.css';
import { BrowserRouter as Router, Switch, Route, Link, Redirect, useHistory, useLocation } from "react-router-dom";
import { withRouter } from 'react-router-dom';
import { ChangeStream } from 'mongodb';

const ObjectID = require('mongodb').ObjectID;

class Part {
  constructor(partId, count, img) {
    this.id = new ObjectID();
    this.partId = partId;
    this.count = count;
    this.img = img;
  }
}

class Set {
  constructor(setId, partList, partsCount, img) {
    this.id = new ObjectID();
    this.setId = setId;
    this.partsList = partList;
    this.partsCount = partsCount;
    this.img = img;
  }
}

class User {
  constructor(username, password) {
    this.username = username;
    this.password = password;
  }
}

export default function App() {
  return (
    <Router>
      <div>
        <nav className="navigation-bar">
          <ul>
            <li>
              <Link to="/">Login</Link>
            </li>
            <li>
              <Link to="/add-part">Add/Remove Part</Link>
            </li>
            <li>
              <Link to="/add-set">Add/Remove Set</Link>
            </li>
            <li>
              <Link to="/sets-list">Sets List</Link>
            </li>
            <li>
              <Link to="/suggest">Suggestions</Link>
            </li>
            <li>
              <Link to="/parts-list">Parts List</Link>
            </li>
          </ul>
        </nav>

        {/* A <Switch> looks through its children <Route>s and
          renders the first one that matches the current URL. */}
        <Switch>
          <PrivateRoute path="/add-part">
            <AddPart />
          </PrivateRoute>
          <Route path="/sets-list">
            <RoutedListSets />
          </Route>
          <PrivateRoute path="/add-set">
            <AddSet />
          </PrivateRoute>
          <PrivateRoute path="/suggest">
            <RoutedSuggest />
          </PrivateRoute>
          <PrivateRoute path="/parts-list">
            <ListParts />
          </PrivateRoute>
          <Route path="/set-part-list/:setId">
            <RoutedSetPartList />
          </Route>
          <PrivateRoute path="/set-missing-part-list/:setId">
            <RoutedMissingSetPartList />
          </PrivateRoute>
          <Route path="/login">
            <RoutedLogin />
          </Route>
          <Route path="/register">
            <RoutedRegister />
          </Route>
          <PrivateRoute path="/">
            <Home />
          </PrivateRoute>
        </Switch>
      </div>
    </Router>
  );
}

const authentication = {
  isAuthenticated: false,
  user: {},
  authenticate(cb) {
    authentication.isAuthenticated = true;
    setTimeout(cb, 100); // fake async
  },
  signout(cb) {
    authentication.isAuthenticated = false;
    setTimeout(cb, 100);
  }
};

function PrivateRoute({ children, ...rest }) {
  return (
    <Route
      {...rest}
      render={({ location }) =>
        authentication.isAuthenticated ? (
          children
        ) : (
            <Redirect to={{ pathname: "/login", state: { from: location } }} />
          )
      }
    />
  );
}

class Login extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      username: "",
      password: "",
      usernamePlaceholder: "Username",
      passwordPlaceholder: "Password",
      user: {}
    };
    this.handleNameChange = this.handleNameChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handlePassChange = this.handlePassChange.bind(this);
    this.register = this.register.bind(this);
  }

  handleNameChange(event) {
    this.setState({
      username: event.target.value
    });
  }

  handlePassChange(event) {
    this.setState({
      password: event.target.value
    });
  }

  register(event) {
    const { match, location, history } = this.props;
    let { to } = { to: { pathname: "/register" } };
    history.push(to);
  }

  handleSubmit(event) {
    fetch("http://localhost:8080/api/users/" + this.state.username)
      .then(response => {
        if (response.status === 404) {
          alert('Wrong username and/or password');
          throw response.json();
        }
        else if (response.ok) {
          return response.json();
        }
        else {
          throw response.json();
        }
      })
      .then(data => {
        console.log(data);
        this.setState({ user: data });
      })
      .then(() => {
        if (this.state.password.localeCompare(this.state.user.password)) {
          alert('Wrong username and/or password');
        }
        else {
          const { match, location, history } = this.props;
          let { from } = location.state || { from: { pathname: "/" } };
          authentication.authenticate(() => {
            history.replace(from);
          });
          authentication.user = this.state.user;
        }
      })
      .catch(err => console.log(err));


    //alert('User logged in with name ' + this.state.username + " and passowrd " + this.state.password);
    event.preventDefault();
  }

  //<textarea className="form__field" name="part" id='count' required placeholder={this.state.confPasswordPlaceholder} onChange={this.handleConfPassChange} />
  render() {
    return (
      <form className="form__group" onSubmit={this.handleSubmit}>
        <textarea className="form__field" name="part" id='add-part' required placeholder={this.state.usernamePlaceholder} onChange={this.handleNameChange} />
        <input className="form__field" type="password" name="password" id='count' required placeholder={this.state.passwordPlaceholder} onChange={this.handlePassChange} />
        <input className="button_submit" type="submit" value="Login" />
        <input className="button_submit" type="submit" value="Register" onClick={this.register} />
      </form>
    );
  }
}

const RoutedLogin = withRouter(Login);

class Register extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      username: "",
      password: "",
      confirmPassword: "",
      usernamePlaceholder: "Username",
      passwordPlaceholder: "Password",
      confPasswordPlaceholder: "Confirm Password",
    };
    this.handleNameChange = this.handleNameChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handlePassChange = this.handlePassChange.bind(this);
    this.handleConfPassChange = this.handleConfPassChange.bind(this);
  }

  handleNameChange(event) {
    this.setState({
      username: event.target.value
    });
  }

  handlePassChange(event) {
    this.setState({
      password: event.target.value
    });
  }

  handleConfPassChange(event) {
    this.setState({
      confirmPassword: event.target.value
    });
  }

  handleSubmit(event) {
    if (!this.state.password.localeCompare(this.state.confirmPassword)) {
      const user = new User(this.state.username, this.state.password);
      fetch('http://localhost:8080/api/register',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(user)
        })
        .then(response => {
          if (response.status === 304) {
            alert('A user with that username already exists!');
            return response.json();
          }
          else if (response.ok) {
            return response.json();
          }
          else {
            throw response.json();
          }
        })
        .then(user => {
          const { match, location, history } = this.props;
          let { from } = location.state || { from: { pathname: "/" } };
          authentication.authenticate(() => {
            history.replace(from);
          });
          authentication.user = user;
        })
        .catch(err => console.log(err));
    }
    else {
      console.log(this.state.password);
      console.log(this.state.confirmPassword);
      alert('Both passwords much match!');
    }
    event.preventDefault();
  }

  render() {
    return (
      <form className="form__group" onSubmit={this.handleSubmit}>
        <textarea className="form__field" name="part" id='username' required placeholder={this.state.usernamePlaceholder} onChange={this.handleNameChange} />
        <input className="form__field" name="part" type="password" id='password' required placeholder={this.state.passwordPlaceholder} onChange={this.handlePassChange} />
        <input className="form__field" name="part" type="password" id='confPassword' required placeholder={this.state.confPasswordPlaceholder} onChange={this.handleConfPassChange} />
        <input className="button_submit" type="submit" value="Register" />
      </form>
    );
  }
}

const RoutedRegister = withRouter(Register);

class AddPart extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      partId: "",
      count: 0,
      value: 'Part Id',
      countPlaceholder: 'Count'
    };
    this.handleIdChange = this.handleIdChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleCountChange = this.handleCountChange.bind(this);
    this.remove = this.remove.bind(this);
    this.add = this.add.bind(this);
  }

  handleIdChange(event) {
    this.setState({
      value: event.target.value,
      partId: event.target.value
    });
  }

  handleCountChange(event) {
    this.setState({
      count: event.target.value
    });
  }

  add(event) {
    let count1 = this.state.count;
    if (count1 < 0) {
      count1 *= -1;
    }
    this.setState({ count: count1 });
  }

  remove(event) {
    let count1 = this.state.count;
    if (count1 > 0) {
      count1 *= -1;
    }
    this.setState({ count: count1 });
  }

  handleSubmit(event) {
    if (this.state.partId === "") {
      alert('Part was not added because the id field was empty');
      event.preventDefault();
      return;
    }
    const part = new Part(this.state.partId, this.state.count, "lego-parts-imgs/" + this.state.partId + ".JPG");
    fetch("http://localhost:8080/api/parts/" + this.state.partId)
      .then(response => {
        if (response.ok) {
          return response.json();
        }
        if (response.status === 404) {
          alert("A part with ID '" + this.state.partId + "' doesn't exists in the database!");
          throw response.json();
        }
        else {
          throw response.json();
        }
      })
      .then(() => {
        fetch("http://localhost:8080/api/parts/" + authentication.user.username,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(part)
          })
          .then(response => {
            if (response.ok) {
              return response.json();
            }
            if (response.status === 404) {
              alert("Part with ID '" + this.state.partId + "' not found!");
              throw response.json();
            }
            else {
              throw response.json();
            }
          })
          .then(() => {
            if (this.state.count < 0) {
              alert('A part was removed with ID: ' + this.state.value);
            }
            else {
              alert('A part was added with ID: ' + this.state.value);
            }
          })
          .catch(err => console.log(err));
      })
      .catch(err => console.log(err));

    event.preventDefault();
  }

  render() {
    return (
      <form className="form__group" onSubmit={this.handleSubmit}>
        <textarea className="form__field" name="part" id='add-part' required placeholder={this.state.value} onChange={this.handleIdChange} />
        <textarea className="form__field" name="part" id='count' required placeholder={this.state.countPlaceholder} onChange={this.handleCountChange} />
        <input className="button_submit" type="submit" value="Add" onClick={this.add} />
        <input className="button_submit" type="submit" value="Remove" onClick={this.remove} />
      </form>
    );
  }
}

class Home extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <h2 className="parts-list">Hello {authentication.user.username}!</h2>
    );
  }
}

class AddSet extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      setId: 0,
      set: {},
      remove: false,
      value: 'Set Id'
    };
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.add = this.add.bind(this);
    this.remove = this.remove.bind(this);
  }

  add(event) {
    this.setState({ remove: false });
  }

  remove(event) {
    this.setState({ remove: true });
  }

  handleChange(event) {
    this.setState({
      value: event.target.value,
      setId: event.target.value
    });
  }

  handleSubmit(event) {

    fetch("http://localhost:8080/api/sets/" + this.state.setId)
      .then(response => {
        if (response.ok) {
          return response.json();
        }
        if (response.status === 404) {
          alert("A set with ID '" + this.state.setId + "' doesn't exists in the database!");
          throw response.json();
        }
        else {
          throw response.json();
        }
      })
      .then(data => {
        console.log(data);
        this.setState({ set: data });
        console.log(this.state.set)
      })
      .then(() => {
        for (var i = 0; i < this.state.set.partsList.length; ++i) {
          const part = new Part(this.state.set.partsList[i], this.state.set.partsCount[i], "lego-parts-imgs/" + this.state.set.partsList[i] + ".JPG");
          if (this.state.remove) {
            part.count *= -1;
          }
          fetch("http://localhost:8080/api/parts/" + authentication.user.username,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(part)
            })
            .then(response => {
              if (response.ok) {
                return response.json();
              }
              else {
                throw response.json();
              }
            })
            .catch(err => console.log(err));
        }
      })
      .then(() => {
        if (this.state.remove) {
          alert('A set was removed with ID: ' + this.state.value);
        }
        else {
          alert('A set was added with ID: ' + this.state.value);
        }
      })
      .catch(err => console.log(err));

    event.preventDefault();
  }

  render() {
    return (
      <form className="form__group" onSubmit={this.handleSubmit}>
        <textarea className="form__field" name="part" id='add-part' required placeholder={this.state.value} onChange={this.handleChange} />
        <input className="button_submit" type="submit" value="Add" onClick={this.add} />
        <input className="button_submit" type="submit" value="Remove" onClick={this.remove} />
      </form>
    );
  }
}

class Suggest extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      sets: [],
      parts: [],
      suggestions: [],
      button: ""
    };
    this.handleSubmit = this.handleSubmit.bind(this);
    this.suggest = this.suggest.bind(this);
    this.showPartsList = this.showPartsList.bind(this);
  }

  suggest(set, parts) {
    for (var i = 0; i < set.partsList.length; ++i) {
      let found = false;
      for (var j = 0; j < parts.length && !found; ++j) {
        if (parts[j].partId === set.partsList[i] && parts[j].count >= set.partsCount[i]) {
          found = true;
        }
      }
      if (!found) {
        console.log("One or more parts with id " + set.partsList[i] + " are missing for the set with id " + set.setId + "!");
        return;
      }
    }
    let suggest = this.state.suggestions;
    suggest.push(set);
    this.setState({ suggestions: suggest });
  }

  componentDidMount() {
    fetch('http://localhost:8080/api/sets-all')
      .then(response => {
        if (response.ok) {
          return response.json();
        }
        else {
          throw response.json();
        }
      })
      .then(data => {
        console.log(data);
        this.setState({ sets: data });
      })
      .then(() => {
        fetch("http://localhost:8080/api/parts-get/" + authentication.user.username)
          .then(response => {
            if (response.ok) {
              return response.json();
            }
            else {
              throw response.json();
            }
          })
          .then(data => {
            console.log(data);
            this.setState({ parts: data });
          })
          .then(() => {
            console.log(this.state.parts);
            for (var i = 0; i < this.state.sets.length; ++i) {
              const set = new Set(this.state.sets[i].setId, this.state.sets[i].partsList, this.state.sets[i].partsCount, this.state.sets[i].img);
              //console.log(set);
              this.suggest(set, this.state.parts);
            }
          })
          .catch(err => console.log(err));
      })
      .catch(err => console.log(err));
  }

  handleSubmit(event) {
    alert('A part was added with ID: ' + this.state.value);
    event.preventDefault();
  }

  showPartsList(event) {
    this.setState({ button: event.target.id });
    event.preventDefault();

    const { match, location, history } = this.props;
    let { to } = location.state || { to: { pathname: "/set-part-list/" + event.target.id } };
    history.push(to);
  }

  render() {
    return (
      <div className="parts-list">
        {this.state.suggestions.map(set =>
          <div className="single-part" key={set.id}>
            <img className="part-img" src={set.img} onClick={this.handleClick} height="100" width="110"></img>
            <div className="part-info">
              <span className="span-part"> setId: </span>
              <span className="span-part">{set.setId}</span>
              <span className="span-part"> parts count: </span>
              <span className="span-part">{set.partsList.length} </span>
            </div>
            <button className="btn-parts-list" id={set.setId} onClick={this.showPartsList}>Show Parts</button>
          </div>
        )}
      </div>
    );
  }
}

const RoutedSuggest = withRouter(Suggest);

class ListSets extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      sets: [],
      button: "",
      set: {},
      parts: [],
      open: false
    };
    this.handleClick = this.handleClick.bind(this);
    this.showPartsList = this.showPartsList.bind(this);
    this.showMissingParts = this.showMissingParts.bind(this);
    this.popup = this.popup.bind(this);
    this.openModal = this.openModal.bind(this);
    this.closeModal = this.closeModal.bind(this);
  }

  openModal() {
    this.setState({ open: true });
  }
  closeModal() {
    this.setState({ open: false });
  }

  componentDidMount() {
    fetch('http://localhost:8080/api/sets-all')
      .then(response => {
        if (response.ok) {
          return response.json();
        }
        else {
          throw response.json();
        }
      })
      .then(data => {
        console.log(data);
        this.setState({ sets: data });
      })
      .catch(err => console.log(err));
  }

  handleClick(event) {
    //alert('A part was added with ID: ' + this.state.value);
    event.preventDefault();

  }

  popup(event) {
    this.setState({ open: true });
    alert('Button clicked' + event.target.id);
    event.preventDefault();
    fetch("http://localhost:8080/api/sets/" + event.target.id)
      .then(response => {
        if (response.ok) {
          return response.json();
        }
        else {
          throw response.json();
        }
      })
      .then(data => {
        console.log(data);
        this.setState({ set: data });
      })
      .then(() => {
        for (var i = 0; i < this.state.set.partsList.length; ++i) {
          const part = new Part(this.state.set.partsList[i], this.state.set.partsCount[i], "lego-parts-imgs/" + this.state.set.partsList[i] + ".JPG");
          let parts1 = this.state.parts;
          parts1.push(part);
          this.setState({ parts: parts1 });
        }
      })
      .catch(err => console.log(err));
  }

  showPartsList(event) {
    this.setState({ button: event.target.id });
    event.preventDefault();

    const { match, location, history } = this.props;
    let { to } = { to: { pathname: "/set-part-list/" + event.target.id } };
    history.push(to);
  }

  showMissingParts(event) {
    this.setState({ button: event.target.id });
    event.preventDefault();

    const { match, location, history } = this.props;
    let { to } = { to: { pathname: "/set-missing-part-list/" + event.target.id } };
    history.push(to);
  }

  render() {
    return (
      <div className="parts-list">
        {this.state.sets.map(set =>
          <div className="single-part" key={set.id}>
            <img className="part-img" src={set.img} onClick={this.handleClick} height="100" width="110"></img>
            <div className="part-info">
              <span className="span-part"> setId: </span>
              <span className="span-part">{set.setId}</span>
              <span className="span-part"> parts count: </span>
              <span className="span-part">{set.partsList.length} </span>
            </div>
            <button className="btn-parts-list" id={set.setId} onClick={this.showPartsList}>Show Parts</button>
            <button className="btn-parts-list" id={set.setId} onClick={this.showMissingParts}>Missing Parts</button>
          </div>
        )}
      </div>
    );
  }
}
/*
<Popup
              open={this.state.open}
              closeOnDocumentClick
              modal
              onOpen={this.showPartsList}
              onClose={this.closeModal}>
              {() => (
                <div>
                  <div className="parts-list">
                    {this.state.parts.map(part =>
                      <div className="single-part">
                        <img className="part-img" src={part.img} height="100" width="110"></img>
                        <div className="part-info">
                          <span className="span-part"> partId: </span>
                          <span className="span-part">{part.partId}</span>
                          <span className="span-part"> count: </span>
                          <span className="span-part">{part.count} </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </Popup>
*/

const RoutedListSets = withRouter(ListSets);

class SetPartList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      parts: [],
      set: [],
      setId: ""
    };
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  componentDidMount() {
    const { match, location, history } = this.props;
    console.log(this.props.match.params.setId);
    console.log(this.props);
    fetch("http://localhost:8080/api/sets/" + this.props.match.params.setId)
      .then(response => {
        if (response.ok) {
          return response.json();
        }
        else {
          throw response.json();
        }
      })
      .then(data => {
        console.log(data);
        this.setState({ set: data });
      })
      .then(() => {
        for (var i = 0; i < this.state.set.partsList.length; ++i) {
          const part = new Part(this.state.set.partsList[i], this.state.set.partsCount[i], "../lego-parts-imgs/" + this.state.set.partsList[i] + ".JPG");
          let parts1 = this.state.parts;
          parts1.push(part);
          this.setState({ parts: parts1 });
          /*fetch("http://localhost:8080/api/parts/" + this.state.set.partsList[i])
            .then(response => {
              if (response.ok) {
                return response.json();
              }
              else {
                throw response.json();
              }
            })
            .then(data => {
              let parts1 = this.state.parts;
              data.count = this.state.set.partsCount[i];
              parts1.push(data);
              this.setState({ parts: parts1 });
            })
            .catch(err => console.log(err));*/
        }
      })
      .catch(err => console.log(err));
  }

  handleSubmit(event) {
    alert('A part was added with ID: ' + this.state.value);
    event.preventDefault();
  }

  render() {
    return (
      <div className="parts-list">
        {this.state.parts.map(part =>
          <div className="single-part" key={part.id}>
            <img className="part-img" src={part.img} height="100" width="110"></img>
            <div className="part-info">
              <span className="span-part"> partId: </span>
              <span className="span-part">{part.partId}</span>
              <span className="span-part"> count: </span>
              <span className="span-part">{part.count} </span>
            </div>
          </div>
        )}
      </div>
    );
  }
}

const RoutedSetPartList = withRouter(SetPartList);

class MissingSetPartList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      parts: [],
      missingParts: [],
      set: [],
      setId: ""
    };
    this.handleSubmit = this.handleSubmit.bind(this);
    this.fillMissing = this.fillMissing.bind(this);
  }

  fillMissing(set, parts) {
    for (var i = 0; i < set.partsList.length; ++i) {
      let found = false;
      let missingCount = -1;
      for (var j = 0; j < parts.length && !found; ++j) {
        if (parts[j].partId === set.partsList[i]) {
          if (parts[j].count < set.partsCount[i]) {
            missingCount = set.partsCount[i] - parts[j].count;
          }
          found = true;
        }
      }
      if (found) {
        if (missingCount != -1) {
          const part = new Part(set.partsList[i], missingCount, "../lego-parts-imgs/" + set.partsList[i] + ".JPG");
          let missing = this.state.missingParts;
          missing.push(part);
          this.setState({ missingParts: missing });
        }
      }
      else {
        const part = new Part(set.partsList[i], set.partsCount[i], "../lego-parts-imgs/" + set.partsList[i] + ".JPG");
        let missing = this.state.missingParts;
        missing.push(part);
        this.setState({ missingParts: missing });
      }
    }
  }

  componentDidMount() {
    const { match, location, history } = this.props;
    console.log(this.props.match.params.setId);
    console.log(this.props);
    fetch("http://localhost:8080/api/sets/" + this.props.match.params.setId)
      .then(response => {
        if (response.ok) {
          return response.json();
        }
        else {
          throw response.json();
        }
      })
      .then(data => {
        console.log(data);
        this.setState({ set: data });
      })
      .then(() => {
        fetch("http://localhost:8080/api/parts-get/" + authentication.user.username)
          .then(response => {
            if (response.ok) {
              return response.json();
            }
            else {
              throw response.json();
            }
          })
          .then(data => {
            console.log(data);
            this.setState({ parts: data });
          })
          .then(() => {
            console.log(this.state.parts);
            const set = new Set(this.state.set.setId, this.state.set.partsList, this.state.set.partsCount, this.state.set.img);
            this.fillMissing(set, this.state.parts);
          })
          .catch(err => console.log(err));
      })
      .catch(err => console.log(err));
  }

  handleSubmit(event) {
    alert('A part was added with ID: ' + this.state.value);
    event.preventDefault();
  }

  render() {
    return (
      <div className="parts-list">
        {this.state.missingParts.map(part =>
          <div className="single-part" key={part.id}>
            <img className="part-img" src={part.img} height="100" width="110"></img>
            <div className="part-info">
              <span className="span-part"> partId: </span>
              <span className="span-part">{part.partId}</span>
              <span className="span-part"> count: </span>
              <span className="span-part">{part.count} </span>
            </div>
          </div>
        )}
      </div>
    );
  }
}

const RoutedMissingSetPartList = withRouter(MissingSetPartList);

class ListParts extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      parts: []
    };
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  componentDidMount() {
    fetch("http://localhost:8080/api/parts-get/" + authentication.user.username)
      .then(response => {
        if (response.ok) {
          return response.json();
        }
        else {
          throw response.json();
        }
      })
      .then(data => {
        console.log(data);
        this.setState({ parts: data });
      })
      .catch(err => console.log(err));
  }

  handleSubmit(event) {
    alert('A part was added with ID: ' + this.state.value);
    event.preventDefault();
  }

  render() {
    return (
      <div className="parts-list">
        {this.state.parts.map(part =>
          <div className="single-part" key={part.id}>
            <img className="part-img" src={part.img} height="100" width="110"></img>
            <div className="part-info">
              <span className="span-part"> partId: </span>
              <span className="span-part">{part.partId}</span>
              <span className="span-part"> count: </span>
              <span className="span-part">{part.count} </span>
            </div>
          </div>
        )}
      </div>
    );
  }
}