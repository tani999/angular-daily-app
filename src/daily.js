let app = angular.module('myNippo', []);
app.controller('myController', function($scope) {
    const restHour = 1;
    $scope.startHour = parseInt(defaultStartHour);
    $scope.startMin = parseInt(defaultStartMin);
    $scope.endHour = parseInt(defaultEndHour);
    $scope.endMin = parseInt(defaultEndMin);
    $scope.current = new Date();

    $scope.isEdit = true;
    $scope.displayTasks = false;

    $scope.taskValues = defaultTaskValues;
    $scope.tasks = defaultTasks;
    $scope.selectedItem = null;
    $scope.transmissionMatter = defaultTransmissionMatter;
    $scope.allWeekDayTasks = defaultAllWeekDayTasks;
    $scope.weekDayTasks = [];

    $scope.allWeekDayTasks.forEach(function(wdTask){
        if (wdTask.weekDay === $scope.current.getDay()) {
            $scope.weekDayTasks.push(wdTask);
        }
    });

    // 就業時間から勤務時間計算
    let calcHoursFromStoE = function() {
      $scope.workingHours = 0;
      $scope.workingMinutes = 0;

      const startHInput = $scope.startHour;
      const startMinute = $scope.startMin;
      const endHInput = $scope.endHour;
      const endMinute = $scope.endMin;

      let workingHour = endHInput - startHInput - restHour;

      let workingMinute = endMinute - startMinute;
      if (workingMinute == 30) {
        $scope.workingHours = workingHour + 0.5;
      } else if (workingMinute < 0) {
        let resultMinute = (60 - parseInt(startMinute)) + parseInt(endMinute);
        workingHour--;
        if (resultMinute == 30) {
          $scope.workingHours = workingHour + 0.5;
          $scope.workingMinutes = null;
          return;
        }
        $scope.workingHours = workingHour
        $scope.workingMinutes = resultMinute;
      } else{
        $scope.workingHours = workingHour;
        $scope.workingMinutes = workingMinute;
      }
    }

    // タスクから勤務時間計算
    this.calcHoursFromTasks = function() {
      let hours = 0;
      let minute = 0;
      $scope.tasks.forEach(task => {
        if (task.hour != null) {
          hours = hours + parseFloat(task.hour);
        }
        if (task.minute != null) {
          minute = minute + parseInt(task.minute);
        }
        if (minute >= 60){
          hours++;
          minute = minute - 60;
        }
      });

      let floorHour = Math.floor(hours);

      if (floorHour !== hours) {
        hours = hours -0.5;
        minute = minute + 30;
      }

      if (minute >= 60){
        hours++;
        minute = minute - 60;
      }

      $scope.executionHour = hours;
      $scope.executionMinute = minute;
    }

    calcHoursFromStoE();
    this.calcHoursFromTasks();

    // タスク追加
    this.onAdd = function() {
        // 時刻が空で分のみ入力されたとき、時刻に0を入力する
        if (this.addTaskMinute != null && this.addTaskHour == null) {
          this.addTaskHour = 0;
        }
        if (this.addTaskValue == null) {
          alert('タスク種別が選択されていません');
          return;
        }

        $scope.tasks.push({ name: this.addTaskName, hour: this.addTaskHour, minute: this.addTaskMinute, value: this.addTaskValue, text: this.addTaskText });
        this.addTaskName = "";
        this.addTaskHour = null;
        this.addTaskMinute = null;
        this.addTaskValue = null;
        this.addTaskText = "";

        this.calcHoursFromTasks();
    }

    // タスク削除
    this.deleteTasks = function() {
        for (let i = 0;i < $scope.tasks.length; i++) {
            if ($scope.tasks[i].checked) {
               $scope.tasks.splice(i--, 1);
            }
        }
        this.calcHoursFromTasks();
    }

    // defaultTasksダウンロード
    this.downloadTasks = function() {
        let array = ["let defaultTasks = " + JSON.stringify($scope.tasks)]
        let blob = new Blob(array ,{type:"text/json"});
        let link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'defaultSettings.txt';
        link.click();
    }

    this.hasTask = function(value) {
        for (let i = 0; i < $scope.tasks.length; i++){
            if ($scope.tasks[i].value == value) {
                return true;
            }
        }
        return false;
    }

    this.incStartHour = function() {
        if ($scope.startHour < 23) {
            $scope.startHour++;
        }
        calcHoursFromStoE();
    }

    this.incStartMin = function() {
        if ($scope.startMin < 50) {
            $scope.startMin = $scope.startMin + 10;
        }
        calcHoursFromStoE();
    }

    this.incEndHour = function() {
        if ($scope.endHour < 23) {
            $scope.endHour++;
        }
        calcHoursFromStoE();
    }

    this.incEndMin = function() {
        if ($scope.endMin < 50) {
            $scope.endMin = $scope.endMin + 10;
        }
        calcHoursFromStoE();
    }

    this.decStartHour = function() {
        if (0 < $scope.startHour) {
            $scope.startHour--;
        }
        calcHoursFromStoE();
    }

    this.decStartMin = function() {
        if (0 < $scope.startMin) {
            $scope.startMin = $scope.startMin - 10;
        }
        calcHoursFromStoE();
    }

    this.decEndHour = function() {
        if (0 < $scope.endHour) {
            $scope.endHour--;
        }
        calcHoursFromStoE();
    }

    this.decEndMin = function() {
        if (0 < $scope.endMin) {
            $scope.endMin = $scope.endMin - 10;
        }
        calcHoursFromStoE();
    }

    let calcTotalTime = function(hour, minute) {
        let hourArray = ("" + hour).split('.');
        let totalMin = minute;
        totalMin = totalMin + (parseInt(hourArray[0]) * 60);
        if (hourArray.length < 2) {
            return totalMin;
        }
        if (parseInt(hourArray[1]) === 5) {
          totalMin = totalMin + 30;
        }
        return totalMin;
    }

    this.switchDisplay = function() {
        $scope.isEdit = !$scope.isEdit;
    }

    this.switchDisplayWithAlert = function() {
        let workingTime = calcTotalTime($scope.workingHours, $scope.workingMinutes);
        let executionTime = calcTotalTime($scope.executionHour, $scope.executionMinute);
        if (workingTime === executionTime) {
            this.switchDisplay();
        } else {
            alert("勤務時間と作業時間が異なります");
        }
    }

});