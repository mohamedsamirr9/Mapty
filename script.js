'use strict';

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
const deleteBtn = document.querySelector('.btn-delete');

containerWorkouts.addEventListener('click', function (e) {
  console.log(e.target);
});

class Workout {
  id = Date.now() + ''.slice(-10);
  clicks = 0;
  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = distance;
    this.duration = duration;
  }
  _setDescription() {
    //Running on December 13
    return `${this.type.slice(0, 1).toUpperCase() + this.type.slice(1)} on ${
      months[new Date().getMonth()]
    } ${new Date().getDay()}`;
  }
  click() {
    this.clicks++;
  }
}

class Running extends Workout {
  type = 'running';
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
  }
  calcPace() {
    // min/km
    this.pace = this.duration / this.distance;
  }
}

class Cycling extends Workout {
  type = 'cycling';
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
  }
  calcSpeed() {
    // km/h
    this.speed = this.distance / (this.duration / 60);
  }
}
const runWorkout = new Running([20, 30], 300, 20, 50);
const cycWorkout = new Cycling([20, 30], 300, 20, 50);

class App {
  #mapEvent;
  #map;
  #coords;
  #zoom = 13;
  workOuts = [];
  workout;
  constructor() {
    this._getPosition();
    form.addEventListener('submit', this._newWokout.bind(this));
    inputType.addEventListener('change', this._toggleElevationField.bind(this));
    containerWorkouts.addEventListener(
      'click',
      this._workoutOptions.bind(this)
    );
    this._getLocalstorage();
    deleteBtn.addEventListener('click', this.reset);
  }
  _getPosition() {
    //get get the geographical position of a user.
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),

        () => alert(`cant't get your location`)
      );
    }
  }
  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    console.log(`https://www.google.com/maps/@${latitude},${longitude}`);
    this.#coords = [latitude, longitude];

    //second arg for zoom
    this.#map = L.map('map').setView(this.#coords, this.#zoom);
    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);
    this.#map.on('click', this._showForm.bind(this));
    //get from local storage and mark after map loaded
    this.workOuts.forEach(work => {
      work.type === 'running'
        ? (work.__proto__ = Running.prototype)
        : Cycling.prototype;
      this.workout = work;
      this._renderWorkoutMarker();
    });
  }
  _showForm(mapEV) {
    this.#mapEvent = mapEV;
    form.classList.remove('hidden');
    inputDistance.focus();
  }
  _hideForm() {
    //clear form
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        '';

    //hide form
    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'), 1000);
  }
  _toggleElevationField() {
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
  }
  _newWokout(e) {
    e.preventDefault();
    //helper functions
    const inputNotValid = function (...inputs) {
      return inputs.some(input => isNaN(input));
    };
    const inputNegative = function (...inputs) {
      return inputs.some(input => input <= 0);
    };
    //submit when edit
    if (!this.#mapEvent) {
      const editDistance = (this.workout.distance = +inputDistance.value);
      const editDuration = (this.workout.duration = +inputDuration.value);
      if (this.workout.type === 'running') {
        if (inputType.value === 'cycling') {
          return alert('Type Must Be Running ');
        }
        const editCadence = (this.workout.cadence = +inputCadence.value);
        this.workout.calcPace();
        //check if valid data
        if (
          inputNotValid(editDistance, editDuration, editCadence) ||
          inputNegative(editDistance, editDuration, editCadence)
        ) {
          return alert('Inputs have to be positive numbers!');
        }
      }
      if (this.workout.type === 'cycling') {
        if (inputType.value === 'running') {
          return alert('Type Must Be Cycling');
        }
        // prettier-ignore
        const editElevation= this.workout.elevationGain = +inputElevation.value;
        this.workout.calcSpeed();
        //check if valid data
        if (
          inputNotValid(editDistance, editDuration, editElevation) ||
          inputNegative(editDistance, editDuration, editElevation)
        ) {
          return alert('Inputs have to be positive numbers!');
        }
      }
      //update LocalStorage
      this._addToLocalstorage();

      //hide + clear
      this._hideForm();

      //page reload
      location.reload();

      return;
    }
    //when new one
    const { lat, lng } = this.#mapEvent.latlng;

    //read data from form
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;

    //check if running or cycling workout
    if (type === 'running') {
      const cadence = +inputCadence.value;
      console.log(type, distance, duration, cadence);
      //check if valid data
      if (
        inputNotValid(distance, duration, cadence) ||
        inputNegative(distance, duration, cadence)
      ) {
        return alert('Inputs have to be positive numbers!');
      }
      //add workout to workouts
      this.workout = new Running([lat, lng], distance, duration, cadence);
      this.workOuts.push(this.workout);
    }
    if (type === 'cycling') {
      const elevationGain = +inputElevation.value;
      console.log(type, distance, duration, elevationGain);
      //check if valid data
      if (
        inputNotValid(distance, duration, elevationGain) ||
        inputNegative(distance, duration, elevationGain)
      ) {
        return alert('Inputs have to be positive numbers!');
      }
      //add workout to workouts
      this.workout = new Cycling([lat, lng], distance, duration, elevationGain);

      this.workOuts.push(this.workout);
    }

    //render workout on map
    this._renderWorkoutMarker();

    //render workout in list
    this._renderWorkout();

    //Add to LocalStorage
    this._addToLocalstorage();

    //hide + clear
    this._hideForm();
  }

  _renderWorkoutMarker() {
    L.marker(this.workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          content: `${this._iconChange()} ${this.workout._setDescription()}`,
          className: `${inputType.value}-popup`,
        })
      )
      .openPopup();
  }
  _renderWorkout() {
    let html = `<li class="workout workout--${this.workout.type}" data-id="${
      this.workout.id
    }">
    <h2 class="workout__title">${this.workout._setDescription()}</h2>
    <div class="workout__details">
      <span class="workout__icon">${this._iconChange()}</span>
      <span class="workout__value">${this.workout.distance}</span>
      <span class="workout__unit">km</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">⏱</span>
      <span class="workout__value">${this.workout.duration}</span>
      <span class="workout__unit">min</span>
    </div>`;
    if (this.workout.type === 'running') {
      html += `<div class="workout__details">
        <span class="workout__icon">⚡️</span>
        <span class="workout__value">${this.workout.pace.toFixed(1)}</span>
        <span class="workout__unit">min/km</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">🦶🏼</span>
        <span class="workout__value">${this.workout.cadence}</span>
        <span class="workout__unit">spm</span>
      </div>
      <div class="edit-btns">
            <button class="btn delete-btn">Detele</button>
            <button class="btn edit-btn">Edit</button>
          </div>
    </li>`;
    }
    if (this.workout.type === 'cycling') {
      html += `<div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${this.workout.speed.toFixed(1)}</span>
          <span class="workout__unit">km/h</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⛰</span>
          <span class="workout__value">${this.workout.elevationGain}</span>
          <span class="workout__unit">m</span>
        </div>
        <div class="edit-btns">
            <button class="btn delete-btn">Detele</button>
            <button class="btn edit-btn">Edit</button>
          </div>
      </li>`;
    }
    form.insertAdjacentHTML('afterend', html);
  }
  _iconChange() {
    return this.workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️';
  }
  _workoutOptions(e) {
    const workoutEl = e.target.closest('.workout');
    if (!workoutEl) return;
    //set current workout to the target
    this.workout = this.workOuts.find(work => workoutEl.dataset.id === work.id);
    if (e.target.classList.contains('delete-btn')) {
      this._deleteWorkout(workoutEl);
      return;
    }
    if (e.target.classList.contains('edit-btn')) {
      this._editWorkout(workoutEl);
      return;
    }
    this._moveToPopup(workoutEl);
  }
  _moveToPopup(workoutEl) {
    //find workout
    const workout = this.workOuts.find(
      work => workoutEl.dataset.id === work.id
    );
    this.#map.setView(workout.coords, this.#zoom);
    workout.click();
  }
  _deleteWorkout(workoutEl) {
    //find index
    const index = this.workOuts.findIndex(
      work => work.id === workoutEl.dataset.id
    );
    //remove from workouts
    this.workOuts.splice(index, 1);
    //update local storage
    this._addToLocalstorage();
    //reload page
    location.reload();
  }
  _editWorkout(workoutEl) {
    //find workout
    const workout = this.workOuts.find(
      work => workoutEl.dataset.id === work.id
    );
    //empty map event
    this.#mapEvent = undefined;
    //show form
    this._showForm(this.#mapEvent);

    //update local storage
    this._addToLocalstorage();
  }
  _addToLocalstorage() {
    localStorage.setItem('workouts', JSON.stringify(this.workOuts));
  }
  _getLocalstorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));
    if (!data) return;
    this.workOuts = data;
    this.workOuts.forEach(work => {
      //retore prototype chain
      work.type === 'running'
        ? (work.__proto__ = Running.prototype)
        : (work.__proto__ = Cycling.prototype);
      this.workout = work;
      console.log(this.workout);
      this._renderWorkout();
    });
  }
  reset() {
    if (!JSON.parse(localStorage.getItem('workouts'))) {
      return;
    }
    localStorage.removeItem('workouts');
    location.reload();
  }
}
const app = new App();
