/* Title: Inpersistent Worktime Tracker React
 * Author: Laurens Schwager 
 * Date: 09.12.2019
 * Filename: ReactTimeTracker.js
 * License: MIT
 * Version: 1.0
 */


class AddEntryForm extends React.Component {
  /*
   * Displays the form to add a new entry to the existing array of entryobjects.
   * Handles the input and makes it available to the parrent component on submit.
   */
  state = {
    entryTitleInput: '',
    entryStarttimeInput: '',
    entryEndtimeInput: '',
    validTimeFormat: '',
    formErrors: [ //Array with all possible error messages and their current state
      [false, "Please enter a valid timeformat (HH:mm:ss or HH:mm)"]
    ],
    formValid: true
  };

  timeToSeconds = (time) => {
    /*
	 * Converts input time to seconds
	 */
    const timeParts = time.split(':').reverse(); //Split the timestring into an array of seconds minutes hours
    let seconds = 0;
    for(let i = 0; i < timeParts.length; i++) {
      seconds += timeParts[i] * (60 ** (timeParts.length > 2 ? i : i+1)); //Detect if the array is minutes/hours or seconds/minutes/hours
    }
    return seconds;
  };

  secondsToTime = (time) => {
	/*
	 * Converts seconds back to a timestring
	 */
    const sec = time
    const h = Math.floor(sec / 3600);
    const m = Math.floor(sec / 60) % 60;
    const s = sec % 60;

    return [h,m,s].map(v => v < 10 ? "0" + v : v).filter((v,i) => v !== "00" || i > 0).join(":");
  };

  timeToDuration = () => {
    /*
	 * Calculates and returns the duration of the time between the start- and endpoint 
	 */
    let t1 = this.timeToSeconds(this.state.entryStarttimeInput);
    let t2 = this.timeToSeconds(this.state.entryEndtimeInput);
    let durationSeconds = 0;
    
    if(Math.sign(t2 - t1) == -1) { //Check if the second time is smaller than the first
      durationSeconds = (86400 - t1) + t2; //Adds time from the previous day. Example 23:50 - 05:30
    } else {
      durationSeconds = t2 - t1;
    }
  
    return this.secondsToTime(durationSeconds);
  };

  handleSubmit = (event) => {
	/*
	 * Handles what happens if the user submits the form with the "Add Entry" button
	 */
    event.preventDefault(); //Prevent the page form reloading
    
    this.props.onSubmit({ //Sends the object with the correct propertynames to the function in the <App /> component
      id: this.props.currentId, //Gets the next ID from the <App /> component
      title: this.state.entryTitleInput,
      starttime: this.state.entryStarttimeInput,
      endtime: this.state.entryEndtimeInput,
      duration: this.timeToDuration()
    });
  };

  validateTimeInput = (input) => {
	/*
	 * Validates the input of the timefields, to make sure they are a valid time format
	 */
    if(/^([0-1]?[0-9]|2[0-4]):([0-5][0-9])(:[0-5][0-9])?$/.test(input.target.value)){ //Regex for checking if the entered string is in a normal timeformat
      let errors = this.state.formErrors;
      errors[0][0] = false; //Define new errorstate
      this.setState({ //Update the state
        validTimeFormat: true,
        formErrors: errors
      });
    } else {
      let errors = this.state.formErrors;
      errors[0][0] = true; 
      this.setState({
        validTimeFormat: false,
        formErrors: errors
      });
    }
    
    if(this.state.validTimeFormat) { //Checks if anything is invalid and sets the form status to valid or not
      this.setState({formValid: true}); 
    } else {
      this.setState({formValid: false});
    }
  }
  
  handleTimeInput = (input,name) => {
	/*
	 * Handles every change of the time inputs
	 */
    this.setState({[name]: input.target.value});
    this.validateTimeInput(input); //Validate the input
  };
  
  render() {
    return (
      <form onSubmit={this.handleSubmit}>
        <p className="errormessage" style={{display: this.state.formValid ? 'none' : 'block'}}>
          {this.state.formErrors}
        </p>
        <input 
          placeholder="Title"
          value={this.state.entryTitleInput} 
          //On Change update the state of the component
          onChange={event => this.setState({entryTitleInput: event.target.value})} 
        />
        <input 
          placeholder="Starttime" 
          value={this.state.entryStarttimeInput}
          onChange={event => this.handleTimeInput(event,'entryStarttimeInput')}
          onBlur={event => this.validateTimeInput(event)} //Validates the entered input, once the user goes to the next field or clicks somewhere else (out of focus)
          required 
          className="timeinput"
        />
        <input 
          placeholder="Endtime" 
          value={this.state.entryEndtimeInput}
          onChange={event => this.handleTimeInput(event,'entryEndtimeInput')}
          onBlur={event => this.validateTimeInput(event)}
          required 
          className="timeinput"
        />
        <button //Button is disabled while there are still validationproblems
          disabled={this.state.formValid ? false : true}>Add Entry</button> 
      </form>
    );
  }
}

function Entry(props){
  /*
   * Is resposible for every single Timeentry in the EntryList Component-
   */
  const handleClick = (event) => {
    event.preventDefault();
    props.onClick(props.id);
  }
  
  return (
    <div className="timeentry">
      <div className="title">{props.title}</div>
      <div className="duration">{props.duration}</div>
      <div className="time">{props.starttime} - {props.endtime}</div>
      <div className="remove"><button onClick={handleClick}>X</button></div>
    </div>
  )
}

function EntryList(props){
  /*
   * Displays all the existing entries in a array of <Entry /> components
   */
  return (
    <div className="entrylist">
      {props.entryData.map((data) => <Entry {...data} onClick={props.onClick}/>)}
    </div>
  );
}

class App extends React.Component {
  /*
   * Manages the state of the entries and renders all components combined as the final app
   */
  state = {
    entries: []
  };

  addNewEntry = (entry) => {
    this.setState(prevState => ({
      entries: [...prevState.entries, entry] //Expand array by new object fromt he form
    }));
  };

  deleteEntry = (entryId) => {
    function searchEntry(nameKey, myArray) { //Searches in the array for the given ID and returns the arrayindex
      for (let i=0; i < myArray.length; i++) {
        if (myArray[i].id === nameKey) {
          return i;
        }
      }
    };
    
    const entryIndex = searchEntry(entryId, this.state.entries);
    const removedState = this.state.entries.splice(entryIndex,1);
    console.log(entryId);
    console.log(entryIndex);
    console.log(removedState);
    this.setState({
      entires: removedState
    });
  };

  render() {
    //The id for the next object that will be created. 1 if its the first object in the array
    const currentId = this.state.entries.length > 0 ? this.state.entries[this.state.entries.length-1].id + 1 : 1;
    return (
      <div className="app">
        <h1>Worktime Tracker</h1>
        <AddEntryForm onSubmit={this.addNewEntry} currentId={currentId} className="entryform" />
        <EntryList entryData={this.state.entries} onClick={this.deleteEntry} />
      </div>
    )
  };
}

ReactDOM.render(<App />,mountNode);