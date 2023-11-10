'use strict';

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
const featureBtns = document.querySelector('.feature-btns');
const removeAllbtn = document.querySelector('.remove-all-btn');

class Workout {
  id = Date.now().toString().slice(-10);
  date = new Date().getDate();
  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = distance;
    this.duration = duration;
  }
}
class Running extends Workout {
  type = 'running';
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this._setPace();
  }
  _setPace() {
    this.pace = this.duration / this.distance;
  }
}
class Cycling extends Workout {
  type = 'cycling';
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this._setSpeed();
  }
  _setSpeed() {
    this.speed = this.distance / (this.duration / 60);
  }
}

class App {
  #month = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  #map;
  #mapEvent;
  #workouts = [];
  constructor() {
    // Loading Data from the local storage
    this._getLocalStorage();

    // Rendering Workouts on list from local Storage
    this._renderLocalStorageWorkoutsOnList();

    // Getting The current Position and centering on it on the map when loaded
    this._getCurrentPosition();

    // Handling the change of type in the form
    inputType.addEventListener('change', this._toggleElevationField);

    // Handling Submitting of the form
    form.addEventListener('submit', this._newWorkout.bind(this));

    // Centering Map According to Workout marker
    containerWorkouts.addEventListener('click', this._centeringMap.bind(this));

    // Feature Buttons Functionalities
    featureBtns.addEventListener('click', this._removeAllWorkouts.bind(this));
    featureBtns.addEventListener('change', this._sortWorkoutList.bind(this));
  }

  _getCurrentPosition() {
    // Getting Current Location
    navigator.geolocation?.getCurrentPosition(
      this._loadPositionOnMap.bind(this),
      () =>
        alert(
          'Cant fetch your current location, Please check your browser settings'
        )
    );
  }
  _loadPositionOnMap(position) {
    // Getting The Current Location Coordinates
    const {
      coords: { latitude, longitude },
    } = position;
    const currentPositionCoords = [latitude, longitude];

    // Loading the map and centering to current position
    this.#map = L.map('map').setView(currentPositionCoords, 13);

    // Rendering Workouts on Map from Local Storage
    this.#workouts.forEach(workout => this._renderWorkoutOnMap(workout));

    L.tileLayer('https://tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    // Handling a click on map
    this.#map.on('click', this._showForm.bind(this));
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkout(e) {
    e.preventDefault();
    const {
      latlng: { lat, lng },
    } = this.#mapEvent;
    const clickedCoords = [lat, lng];
    let workout;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    if (inputType.value === 'running') {
      const cadence = +inputCadence.value;
      if (!this._inputsValidation(distance, duration, cadence))
        return alert('Wrong Inputs');
      workout = new Running(clickedCoords, distance, duration, cadence);
    }

    if (inputType.value === 'cycling') {
      const elevationGain = +inputElevation.value;
      if (!this._inputsValidation(distance, duration, elevationGain))
        return alert('Wrong Inputs');
      workout = new Cycling(clickedCoords, distance, duration, elevationGain);
    }
    // Pushing our new workout to workouts array
    this.#workouts.push(workout);

    // Visibility of Feature Buttons
    this._featureButtonsVisiblity();

    // Hiding the map
    this._hideForm();

    // Rendering Workout on List
    this._renderWorkoutOnList(workout);

    // Rendering Workout on Map
    this._renderWorkoutOnMap(workout);

    // Storing the Workouts Array in Local Storage
    this._setLocalStorage();
  }

  _renderLocalStorageWorkoutsOnList() {
    this.#workouts.forEach(workout => {
      this._renderWorkoutOnList(workout);
    });
  }

  _renderWorkoutOnList(workout) {
    let html = `<li class="workout workout--${workout.type}" data-id="${
      workout.id
    }">
    <h2 class="workout__title">${this._setWorkoutDescription(workout)}</h2>
    <div class="workout__details">
      <span class="workout__icon">${
        workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
      }</span>
      <span class="workout__value">${workout.distance}</span>
      <span class="workout__unit">km</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">⏱</span>
      <span class="workout__value">${workout.duration}</span>
      <span class="workout__unit">min</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">⚡️</span>`;

    if (workout.type === 'running')
      html += `<span class="workout__value">${workout.pace.toFixed(1)}</span>
      <span class="workout__unit">min/km</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">🦶🏼</span>
      <span class="workout__value">${workout.cadence}</span>
      <span class="workout__unit">spm</span>
    </div>
  </li>`;

    if (workout.type === 'cycling')
      html += `<span class="workout__value">${workout.speed.toFixed(1)}</span>
  <span class="workout__unit">km/h</span>
</div>
<div class="workout__details">
  <span class="workout__icon">⛰</span>
  <span class="workout__value">${workout.elevationGain}</span>
  <span class="workout__unit">m</span>
</div>
</li>`;
    form.insertAdjacentHTML('afterend', html);
  }

  _renderWorkoutOnMap(workout) {
    L.marker(workout.coords, { riseOnHover: true })
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          // keepInView: true,

          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
          minWidth: 50,
          maxWidth: 200,
        }).setContent(
          `${
            workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
          }  ${this._setWorkoutDescription(workout)}`
        )
      )
      .openPopup();
  }

  _hideForm() {
    // Clearing all input fields
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        '';
    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => {
      form.style.display = 'grid';
    }, 1000);
  }

  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }
  _getLocalStorage() {
    const storedWorkouts = JSON.parse(localStorage.getItem('workouts'));
    if (!storedWorkouts) return;
    this.#workouts = storedWorkouts;
    this._featureButtonsVisiblity();
  }

  _centeringMap(e) {
    const clickedWorkoutEl = e.target.closest('.workout');
    if (!clickedWorkoutEl) return;
    const workout = this.#workouts.find(
      workout => clickedWorkoutEl.dataset.id === workout.id
    );
    this.#map.setView(workout.coords, 13);
  }
  _removeAllWorkouts(e) {
    const clicked = e.target;
    if (!clicked.closest('.remove-all-btn')) return;
    this._clearLocalStorage();
    // featureBtns.style.display = 'none';
  }
  _clearLocalStorage() {
    if (localStorage.getItem('workouts')) {
      localStorage.removeItem('workouts');
      location.reload();
    }
  }
  _featureButtonsVisiblity() {
    if (this.#workouts.length > 0) featureBtns.style.display = 'flex';
    else featureBtns.style.display = 'none';
  }
  _sortWorkoutList(e) {
    let sortedWorkouts = [...this.#workouts];
    const sortValue = e.target.value;

    // Clearing the current Showing Workouts from the list
    document.querySelectorAll('.workout').forEach(workout => workout.remove());
    if (sortValue === 'all') sortedWorkouts = [...this.#workouts];
    if (sortValue === 'distance--ascending') {
      sortedWorkouts = this._ascendingSortedWorkouts(
        sortedWorkouts,
        'distance'
      );
    }
    if (sortValue === 'distance--descending') {
      sortedWorkouts = this._descendingSortedWorkouts(
        sortedWorkouts,
        'distance'
      );
    }
    if (sortValue === 'duration--ascending') {
      sortedWorkouts = this._ascendingSortedWorkouts(
        sortedWorkouts,
        'duration'
      );
    }
    if (sortValue === 'duration--descending') {
      sortedWorkouts = this._descendingSortedWorkouts(
        sortedWorkouts,
        'duration'
      );
    }
    sortedWorkouts.forEach(workout => this._renderWorkoutOnList(workout));
  }

  _ascendingSortedWorkouts(workouts, sortBy) {
    return workouts.sort(
      (
        { distance: distance1, duration: duration1 },
        { distance: distance2, duration: duration2 }
      ) => {
        if (sortBy === 'distance') return distance2 - distance1;
        if (sortBy === 'duration') return duration2 - duration1;
      }
    );
  }
  _descendingSortedWorkouts(workouts, sortBy) {
    return workouts.sort(
      (
        { distance: distance1, duration: duration1 },
        { distance: distance2, duration: duration2 }
      ) => {
        if (sortBy === 'distance') return distance1 - distance2;
        if (sortBy === 'duration') return duration1 - duration2;
      }
    );
  }

  _setWorkoutDescription({ type, date }) {
    return `${type === 'running' ? 'Running' : 'Cycling'} on ${
      this.#month[new Date().getMonth()]
    } ${date}`;
  }
  _inputsValidation(...inputs) {
    return inputs.every(input => Number.isFinite(input) && input > 0);
  }
}

const app = new App();
