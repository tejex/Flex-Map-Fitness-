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
//**************************************///


class Workout{
  date = new Date();
  id =  (Date.now() + '');
  constructor(distance, duration, coords){
    this.distance = distance;
    this.duration =duration;
    this.coords = coords; // needs to be an array of coordinates []
  }
  _setDescription(){
     this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${months[this.date.getMonth()]} ${this.date.getDate()}`
  }
}

class Running extends Workout{
  type = 'running'
  constructor(distance, duration, coords,cadence){
    super(distance, duration, coords);
    this.cadence = cadence;
    this._calcPace();
    this._setDescription();
  }
  _calcPace(){
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}


class Biking extends Workout{
  type = 'cycling'
  constructor(distance, duration, coords,elevationGain){
    super(distance, duration, coords);
    this.elevationGain = elevationGain;
    this._calcSpeed();
    this._setDescription();

  }
  _calcSpeed(){
    this.speed = this.distance / (this.duration / 60)
    return this.speed;
  }
}




class App{
  #map;
  #mapEvent;
  #workouts = [];
  constructor(){

    //Get the users position and display the map
    this._getPosition();

    //get the data from local storage and render the dataset
    this._getLocalStorage()

    //Add event listeners on the map and the form
    form.addEventListener('submit',this._newWorkout.bind(this))
    form.addEventListener('change',this._toggleElevationField)
    containerWorkouts.addEventListener('click',this._moveToPopup.bind(this))
  }
//**************************************///
  _getPosition(){

    navigator.geolocation.getCurrentPosition(this._loadMapPosition.bind(this), function(){
      console.log('cant find location');
    })
  }

//**************************************///

  _loadMapPosition(position){

    console.log(position);

    const {latitude} = position.coords;
    const {longitude} = position.coords;

    this.#map = L.map('map').setView([latitude, longitude], 13);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this.#map);

     this.#map.on('click',this._showForm.bind(this))

     this.#workouts.forEach(workout =>{
       this._renderWorkoutMarker(workout)
     })

  }
//**************************************///
  _showForm(mapE){
    this.#mapEvent = mapE;
    form.classList.remove('hidden')
    inputDistance.focus();
  }
//**************************************///
  _hideForm(){
    inputCadence.value = inputDistance.value = inputDuration.value = inputElevation.value = '';
    form.classList.add('hidden')
  }



//**************************************///
  _toggleElevationField(){
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden')
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden')
  }
//**************************************///
  _newWorkout(e){

    const validInputChecker = (...inputs) => inputs.every(input => Number.isFinite(input))


    const allPositive = (...inputs) => inputs.every(input => input > 0)

    e.preventDefault();

    //Grabing the data from the form
    const workoutType = inputType.value;
    const workoutDistance = +inputDistance.value;
    const workoutDuration = +inputDuration.value;
    const {lat,lng} = this.#mapEvent.latlng;
    let workout;
    //check to see if the data is valid
    //if running, make running object

    if(workoutType ==='running'){
        const workoutCadence = +inputCadence.value;
        if(!validInputChecker(workoutCadence, workoutDistance, workoutDuration) ||
           !allPositive(workoutCadence, workoutDistance,workoutDuration)){
        return alert('Inputs have to be positive numbers')
      }
      workout = new Running(workoutDistance, workoutDuration,[lat, lng],workoutCadence)
    }


    if(workoutType ==='cycling'){
        const workoutElevation = +inputElevation.value;
        if(!validInputChecker(workoutElevation, workoutDistance, workoutDuration)||
           !allPositive( workoutDistance,workoutDuration)){
        return alert('Inputs have to be positive numbers')
      }
      workout = new Biking(workoutDistance, workoutDuration,[lat, lng],workoutElevation)
    }
    this.#workouts.push(workout)
    //render workout on map as marker
    this._renderWorkoutMarker(workout)

    //render workout on classList
    this._renderWorkout(workout)

    // hide the form and clear  input fields
    this._hideForm()

    //put the workouts in local storage with the local storage API
    this._setLocalStorage()


  }
//**************************************///

  _renderWorkoutMarker(workout){

    const marker = new L.marker(workout.coords).addTo(this.#map).bindPopup(L.popup({
      autoClose:false,
      maxWidth: 250,
      minWidth: 100,
      closeOnClick: false,
      className: `${workout.type}-popup`
       }))
      .setPopupContent(`Send me message like location location </br> ${workout.distance} km`)
      .openPopup();

  }
  //**************************************///

  _renderWorkout(workout){
    let html =
    `<li class="workout workout--${workout.type}" data-id="${workout.id}">
      <h2 class="workout__title">${workout.description}</h2>
      <div class="workout__details">
        <span class="workout__icon">${workout.type ==='running'? '🏃‍': '🚴' }</span>
        <span class="workout__value">${workout.distance}</span>
        <span class="workout__unit">km</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">⏱</span>
        <span class="workout__value">${workout.duration}</span>
        <span class="workout__unit">min</span>
      </div>`;

      if(workout.type === 'running'){
        html +=
        `<div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.pace.toFixed(1)}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workout.cadence.toFixed(1)}</span>
            <span class="workout__unit">spm</span>
          </div>
        </li>`
      }
      if(workout.type === 'cycling'){
        html+=
      `<div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed.toFixed(1)}</span>
            <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.elevationGain}</span>
            <span class="workout__unit">m</span>
          </div>
      </li> `
      }

      form.insertAdjacentHTML('afterend',html)
  }
  //**************************************///

  _moveToPopup(e){
    const workoutEl = e.target.closest('.workout')

    if(!workoutEl)return
    console.log(workoutEl);

    const workout = this.#workouts.find(elem => elem.id === workoutEl.dataset.id)
    console.log(workout);

    this.#map.setView(workout.coords,13,{
      animate:true,
      pan:{
        duration:1
      }
    })

  }
//**************************************///
  _setLocalStorage(){
    localStorage.setItem('workout', JSON.stringify(this.#workouts))
  }
  _getLocalStorage(){
    const data = JSON.parse(localStorage.getItem('workout'))

    if(!data) return

    this.#workouts = data;
    this.#workouts.forEach(workout => this._renderWorkout(workout))
  }
//**************************************///
  reset(){
    localStorage.removeItem('workout')
    location.reload();
  }

//**************************************///

}

const app = new App();
















//
