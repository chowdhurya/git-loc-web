import $ from 'jquery';
import React from 'react';
import ReactDOM from 'react-dom';

const URL = "http://gitloc.chowdhurya.com";

const statuses = {
  START: 0,
  ERROR: 1,
  PARSING_URL: 2,
  GETTING_LOC: 3,
  FINISHED: 4
};

class NavBar extends React.Component {

  render() {
    return (
      <nav className="navbar navbar-default">
        <div className="container-fluid">
          <a className="navbar-brand" href="/">GitLOC - Git Lines of Code</a>
        </div>
      </nav>
    );
  }

}

class Description extends React.Component {

  render() {
    return (
      <div className="container-fluid">
        <div className="row col-sm-10 col-sm-offset-1">
          <div className="page-header">
            <p className="lead">
              GitLOC lists the lines of code in a GitHub repository so that you
              can quickly estimate how complex a project is.

              Simply enter the URL of a GitHub repository and hit "Go."
            </p>
          </div>
        </div>
      </div>
    );
  }

}

class LinkInput extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <form onSubmit={this.props.onLinkSubmit}>
          <div className="row">
            <div className="col-sm-10 col-sm-offset-1">
              <div className="input-group">
                <input type="text"
                       className="form-control"
                       id="url-input"
                       placeholder="Enter repository link..." />
                <span className="input-group-btn">
                  <input className="btn btn-default"
                          type="submit"
                          value="Go!" />
                </span>
              </div>
            </div>
          </div>
      </form>
    );
  }
}

class NotificationBar extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    let alertClass = null;
    if (this.props.type == 'error') {
      alertClass = "alert alert-danger";
    } else if (this.props.type == 'info') {
      alertClass = "alert alert-info";
    }

    return (
      <div className="row" style={{"marginTop": "10px"}}>
        <div className="col-sm-10 col-sm-offset-1">
          <div className={alertClass} role="alert">
            {this.props.text}
          </div>
        </div>
      </div>
    );
  }
}

class LocDisplay extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const langData = this.props.data["languages"];
    const sortedLangs = Object.keys(langData)
      .sort((a, b) => langData[b]["source"] - langData[a]["source"]);
    const rows = sortedLangs.map((lang) => {
      return (
        <tr key={lang}>
          <td>*.{lang}</td>
          <td>{this.props.data["languages"][lang]["source"]}</td>
          <td>{this.props.data["languages"][lang]["total"]}</td>
        </tr>
      );
    });

    return (
      <div className="row">
        <div className="col-sm-10 col-sm-offset-1">
          <h2>LOC Data for {this.props.owner}/{this.props.repo}</h2>
          <table className="table table-hover">
            <thead>
              <tr>
                <th>Extension</th>
                <th>Source Lines of Code</th>
                <th>Physical Lines</th>
              </tr>
            </thead>
            <tbody>
              <tr key="sum" className="success">
                <td>SUM</td>
                <td>{this.props.data["summary"]["source"]}</td>
                <td>{this.props.data["summary"]["total"]}</td>
              </tr>
              {rows}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
}

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      appState: {
        status: statuses.START
      }
    }

    this.handleLinkSubmit = this.handleLinkSubmit.bind(this);
  }

  setError(error) {
    this.setState({
      appState: {
        status: statuses.ERROR,
        error: error
      }
    });
  }

  setParsingUrl(xhr) {
    this.setState({
      appState: {
        status: statuses.PARSING_URL,
        xhr: xhr
      }
    });
  }

  setGettingLoc(owner, repo) {
    const appState = this.state.appState;
    if (appState.status == statuses.PARSING_URL
        || appState.status == statuses.GETTING_LOC) {
      appState.xhr.abort();
    }

    const xhr = $.get({
      url: `${URL}/loc/github`,
      dataType: "json",
      data: {
        "owner": owner,
        "repo": repo
      },
      success: (data) => {
        if ("error" in data) {
          this.setError(data["error"]);
        } else {
          this.setFinished(data);
        }
      },
      error: (xhr, status, err) => {
        this.setError("server_error");
      }
    });

    this.setState({
      appState: {
        status: statuses.GETTING_LOC,
        owner: owner,
        repo: repo,
        xhr: xhr
      }
    });
  }

  setFinished(locData) {
    this.setState({
      appState: {
        status: statuses.FINISHED,
        owner: this.state.appState.owner,
        repo: this.state.appState.repo,
        locData: locData
      }
    })
  }

  handleLinkSubmit(e) {
    e.preventDefault();
    const url = document.getElementById("url-input").value.trim();
    if (!url) {
      return;
    }
    const appState = this.state.appState;
    if (appState.status == statuses.PARSING_URL
        || appState.status == statuses.GETTING_LOC) {
      appState.xhr.abort();
    }
    let xhr = $.get({
      url: `${URL}/repo`,
      dataType: "json",
      data: {
        "url": url
      },
      success: (data) => {
        if ("error" in data) {
          this.setError(data["error"]);
        } else {
          this.setGettingLoc(data["owner"], data["repo"]);
        }
      },
      error: (xhr, status, err) => {
        this.setError("server_error");
      }
    });
    this.setParsingUrl(xhr);
  }

  render() {
    const appState = this.state.appState;

    // Render notification bar if necessary
    let notificationBar = null;
    if (appState.status == statuses.ERROR) {
      let errorText = null;
      if (appState.error == "invalid_url") {
        errorText = "You entered an invalid URL.";
      } else if (appState.error == "invalid_repo") {
        errorText = "The repository is invalid.";
      } else if (appState.error == "repo_too_big") {
        errorText = "The repository is too large to parse.";
      } else if (appState.error == "parse_error") {
        errorText = "Something went wrong while parsing the repository.";
      } else if (appState.error == "server_error") {
        errorText = "There was an error with the server.";
      } else {
        errorText = "An unknown error occurred.";
      }

      notificationBar = <NotificationBar type="error" text={errorText} />;
    } else if (appState.status == statuses.PARSING_URL) {
      const text = "Parsing URL...";
      notificationBar = <NotificationBar type="info" text={text} />;
    } else if (appState.status == statuses.GETTING_LOC) {
      const text = `Getting LOC count for Github repo
                    ${appState.owner}/${appState.repo}. This may take a while.`
      notificationBar = <NotificationBar type="info" text={text} />;
    }

    // Render LOC table if necessary
    let locDisplay = null;
    if (appState.status == statuses.FINISHED) {
      locDisplay = <LocDisplay owner={appState.owner}
                               repo={appState.repo}
                               data={appState.locData} />
    }

    return (
      <div>
        <NavBar />
        <Description />
        <div className="container-fluid">
          <LinkInput onLinkSubmit={this.handleLinkSubmit} />
          {notificationBar}
          {locDisplay}
        </div>
      </div>
    );
  }
}


ReactDOM.render(
  <App />,
  document.getElementById('app')
);
