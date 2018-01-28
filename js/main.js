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
          if (event.target.id == this.state.rand || event.target.parentElement.id == this.state.rand) {
            //click might land on the li or the span inside, quick and dirty check
            this.state.winner = true;
            //yay
            document.getElementById(this.state.rand).style.backgroundColor = "green"
        } else {
              this.state.loser = true;
              // awww :'(
              // document.getElementById(this.state.rand).innerText += " <===" maybe dont directly modify the dom when ur using vue, huh?
              // this.state.currentAnswers[this.state.rand] += " <==="
              document.getElementById(this.state.rand).style.backgroundColor = "yellow"
              //point out the correct answer...cuz learning
        }
        this.state.checked = true
        //signifies that this question has been checked
      } else { console.log("nice try") }
    },
    nextQuestion: function() {
      if (this.state.winner===true) {
        this.state.persistent.score += 1
      }
      //reset answer backgroundColor
      const answers = document.getElementsByClassName("answers");
      for (i=0;i<answers.length;i++) {
        answers[i].style.backgroundColor = "white"
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
        this.endGame()
      }
    },
    endGame: function() {
      this.state.persistent.gameOver = true;

      this.state.currentQuestion = 0;
      //todo something
      console.log("Game over, man!\nGame over!")
    }


  },
  mounted() {this.state.totalQuestions = parseInt(this.url.queryAmount)}
})
