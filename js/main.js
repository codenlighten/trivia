var app = new Vue({
  el: '#app',

  data: {
    category: "any",
    kv: JSON.parse('{"9":"General Knowledge","10":"Entertainment: Books","11":"Entertainment: Film","12":"Entertainment: Music","13":"Entertainment: Musicals & Theatres","14":"Entertainment: Television","15":"Entertainment: Video Games","16":"Entertainment: Board Games","17":"Science & Nature","18":"Science: Computers","19":"Science: Mathematics","20":"Mythology","21":"Sports","22":"Geography","23":"History","24":"Politics","25":"Art","26":"Celebrities","27":"Animals","28":"Vehicles","29":"Entertainment: Comics","30":"Science: Gadgets","31":"Entertainment: Japanese Anime & Manga","32":"Entertainment: Cartoon & Animations","any":"Any Category"}'),
    url: {
      baseUrl: "https://opentdb.com/api.php?amount=",
      queryAmount: "10",
      queryCatAddon: "&category="
    },
    questions: {},
    state: {
      started: false,
      totalQuestions: 0,
      currentQuestion: 0,
      isBool: false,
      isMulti: false,
      currentAnswers: {},
      currentIsLoaded: false,
      checked: false,
      winner: false,
      loser: false,
      rand: 0,
      temp: {

      },
      persistent: {
        score: 0,
        totalQuestions: 0,
        currentQuestion: 0,
        gameOver: false
      }

    }
  },

  methods: {

    detectSwipeLR: function(el,that) {
      //detect swipe and call nextQuestion(), code simplified and adaptded from the interwebs
      var swipezone = document.querySelector(el) ,
      swipedir,
      startX,
      startY,
      distX,
      distY,
      threshold = 150, //required min distance traveled to be considered swipe
      restraint = 100, // maximum distance allowed at the same time in perpendicular direction
      allowedTime = 300, // maximum time allowed to travel that distance
      elapsedTime,
      startTime;

      swipezone.addEventListener('touchstart', function(e){
        // debugger;
        if (that.state.checked) {
          var touchobj = e.changedTouches[0];
          swipedir = 'none';
          dist = 0;
          startX = touchobj.pageX;
          startY = touchobj.pageY;
          startTime = new Date().getTime(); // record time when finger first makes contact with surface
          // e.preventDefault();
        }
      }, false)

      swipezone.addEventListener('touchmove', function(e){
        if (that.state.checked) {
            // e.preventDefault(); // prevent scrolling when inside DIV
          }
      }, false)

      swipezone.addEventListener('touchend', function(e){
        if (that.state.checked) {
          var touchobj = e.changedTouches[0];
          distX = touchobj.pageX - startX; // get horizontal dist traveled by finger while in contact with surface
          distY = touchobj.pageY - startY; // get vertical dist traveled by finger while in contact with surface
          elapsedTime = new Date().getTime() - startTime; // get time elapsed
          if (elapsedTime <= allowedTime) { // first condition for awipe met
              if (Math.abs(distX) >= threshold && Math.abs(distY) <= restraint && that.state.checked === true) { // 2nd condition for horizontal swipe met
                  that.nextQuestion();
                  //swipedir = (distX < 0)? 'left' : 'right';  if dist traveled is negative, it indicates left swipe
              } else {e.target.click();}
              // else if (Math.abs(distY) >= threshold && Math.abs(distX) <= restraint){ // 2nd condition for vertical swipe met
              //     swipedir = (distY < 0)? 'up' : 'down' // if dist traveled is negative, it indicates up swipe
              // }

          }
          // this.handleswipe(swipedir)
          // e.preventDefault();
        }
      }, false)

    },
    startQuiz: function() {
      if (this.state.started === false) {
        this.state.persistent.score = 0;
        this.state.persistent.gameOver = false;
        //reset the score in case this isnt the first time
        var url = this.buildQueryUrl();
        this.fetchJSON(url)
      } else {console.log("I can't start anymore! I'm already as started as I can be!")}
    },
    buildQueryUrl: function() {
      var qUrl = this.url.baseUrl + this.url.queryAmount;
      if (this.category !== "any") {
        qUrl += this.url.queryCatAddon + this.category }
        // console.log(qUrl);
        return qUrl
        // this.fetchJSON(qUrl);
    },
    fetchJSON: function(url) {
      this.$http.get(url).then( function(response) {
        return response.json()
      }, function(error){
        console.log(error)
      }).then( function(json) {
        this.questions = json.results;
        this.processQuestion()
      })
    },
    processQuestion: function() {
      this.state.started = true;
      this.isMultiOrBool();
      this.state.currentCategory = this.getCurrentQuestion().category;
      this.loadQuestion();
    },
    isMultiOrBool: function() {
      // // check if it is a multiple choice questions or a true/false question
      if (this.getCurrentQuestion().type === "multiple") {
        this.state.isMulti = true

      } else if (this.getCurrentQuestion().type === "boolean") {
        this.state.isBool = true

      } else {
        try {
          throw new Error("getCurrentQuestion().type is neither 'multiple' nor 'boolean'"+"\n"+ "Here is the culprit: " + JSON.stringify(this.getCurrentQuestion()))
        }
        catch(e) {
          console.log(e)
        }
      }
    },
    getCurrentQuestion: function() {
      if (this.state.started===true) {
        return this.questions[this.state.currentQuestion]
      } else {
          try {
            throw new Error("Can't get current question when state.started is false")
          }
          catch(e) {
            console.log(e)
          }
      }
    },
    loadQuestion: function() {
      var n = 0;
      if (this.state.isMulti) {
        n = 4;
      } else if (this.state.isBool) {
        n = 2;
      }
        //randomizes the location of the correct answer, then sprinkles the wrong answers around it
        this.state.rand = this.getRand(n);
        // get # from 0 to n-1, thats the position where the correct answer goes
          this.state.currentAnswers[this.state.rand] = this.getCurrentQuestion().correct_answer;
          var skip = false;
          //once we get to the correct answers' spot (rand), skip will be set to true
          for (var i = 0; i < n-1; i++) {
            if (this.state.currentAnswers[i] == undefined && skip === false){
              //if this answers spot is still empty and skip is false, we add the answer to the array
              this.state.currentAnswers[i] = this.getCurrentQuestion().incorrect_answers[i]
            } else {
              skip = true;
              this.state.currentAnswers[i+1] = this.getCurrentQuestion().incorrect_answers[i]
              //now we have encountered the correct answer in the object, so we skip it as to not overwrite it for the rest of this "for" loop
            }
          }
          this.state.currentIsLoaded = true;
          console.log("current question loaded")
          //now we wait for the user to select an answer
      // } else {
      //   //start sobbing maniacly
      //   console.log("malformed question. question type not recognized.");
      //   this.nextQuestion()
      // }
    },
    getRand: function(n) {
      //returns an int between 0 and 3
      return parseInt((Math.random()*n).toString().substring(0,1))
    },

    checkAnswer: function(event) {
      // var ee = 0;
      // debugger;
      if (this.state.checked === false) {
      //conditional to prevent players trying multiple answers on the same question
// debugger;
          console.log(event);
          if ( event.target.id === "a"+this.state.rand.toString() || event.target.parentElement.id === "a"+this.state.rand.toString() ) {
            //click might land on the li or the span inside, hacky fix
            this.state.winner = true;
            //yay
            document.getElementById("a"+this.state.rand).style.backgroundColor = "green"
        } else {
              this.state.loser = true;
              // awww :'(
              // document.getElementById(this.state.rand).innerText += " <===" maybe dont directly modify the dom when ur using vue, huh?
              // this.state.currentAnswers[this.state.rand] += " <==="
              document.getElementById("a"+this.state.rand).style.backgroundColor = "yellow"
              //point out the correct answer...cuz learning
        }
        this.state.checked = true;
        //signifies that this question has been checked

      } else { console.log("nice try") }
    },
    nextQuestion: function() {
      if (this.state.checked === false) {
          console.log("Finish this question first");
          return;
      } else {
          if (this.state.winner===true) {
            this.state.persistent.score += 1
          }
          //reset answer backgroundColor
          const answers = document.getElementsByClassName("answers");
          for (i=0;i<answers.length;i++) {
            answers[i].style.backgroundColor = "white";
          }
          //reset question state
          this.state.started = false;
          this.state.isBool = false;
          this.state.isMulti = false;
          this.state.currentAnswers =  {};
          this.state.currentIsLoaded = false;

          this.state.checked = false;
          this.state.winner = false;
          this.state.loser = false;
          this.state.rand = 0;

          if (this.state.currentQuestion < this.state.totalQuestions-1) {
          //increment current question counter if not at the end
            this.state.currentQuestion += 1;
            this.processQuestion();
          } else {
            this.endGame();
          }
    }},
    endGame: function() {
      this.state.persistent.gameOver = true;

      this.state.currentQuestion = 0;
      //do something
      console.log("Game over, man!\nGame over!");
    }


  },
  mounted() {
    this.state.totalQuestions = parseInt(this.url.queryAmount);
    this.detectSwipeLR("#app", this);
    //swipe handler that calls nextQuestion() on a L or R swipe
  }
})
