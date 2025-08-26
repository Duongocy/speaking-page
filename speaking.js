const practice_container = document.getElementById('practiceContainer');
const lesson_list_container = document.getElementById('lessonListContainer');
const record_button=document.getElementById('recordButton');
const text_from_voice=document.getElementById('recordText');
const url_api = 'https://learning-english-api-o1yh.onrender.com';
let textArray=[];
let sound_ok = new Audio("sound-ok.mp3"); // đường dẫn file âm thanh
let sound_ng = new Audio("sound-ng.mp3"); // đường dẫn file âm thanh
load_lesson_list_from_database();

    
function display_practice_list(data, delay,classname) {
      practice_container.innerHTML = ""
      data.forEach((element, index) => {
        setTimeout(() => {
          const div = document.createElement('div');
          div.className = classname;
          div.style.animationDelay = `${index * 0.1}s`; // nhỏ delay cho mượt
          div.textContent = element.word_sentence;
          practice_container.appendChild(div);
        }, index * delay);
      });
    }
function display_lesson_list(data, delay,classname) {
      lesson_list_container.innerHTML = ""
      data.forEach((element, index) => {
        setTimeout(() => {
          const div = document.createElement('div');
          div.className = classname;
          div.style.animationDelay = `${index * 0.1}s`; // nhỏ delay cho mượt
          div.textContent = element.lesson_title;
          // thêm sự kiện click
          div.addEventListener("click", () => {
            textArray=[];
            // xóa active của tất cả div trong lesson_list_container
              lesson_list_container.querySelectorAll("." + classname).forEach(el => {
                el.classList.remove("active");
              });
            // thêm active cho div vừa click
              div.classList.add("active");
              load_practice_from_database(element.lesson_id);
          });
          lesson_list_container.appendChild(div);          
        }, index * delay);
      });
    }    
async function load_practice_from_database(lessonId){
  let request_string = url_api+'/Invoice?yeucau=wordsentencelist';
    fetch(request_string, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ lesson_id: lessonId })
    })
    .then(function(response) {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(function (data) {
        console.log("Word sentence list nè : ",data);
        textArray = data.map(item => item.word_sentence);
        console.log("Danh sách câu : ",textArray);
        display_practice_list(data,100,'practice-item');
    })
    .catch(function(error) {
        console.error('Error:', error.message); // In ra thông điệp lỗi
    });
}
async function load_lesson_list_from_database(){
    let request_string = url_api+'/Invoice?yeucau=lessonlist';
    fetch(request_string, {
        method: 'GET',
        headers: {
            // 'Authorization': `Bearer ${token}`
            'Authorization': `Bearer`
        }
    })
    .then(function(response) {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(function (data) {
        /////////////////////////////////////////////
        // textArray = data.map(item => item.lesson_title);
        // console.log(textArray);
        display_lesson_list(data,100,'lesson-item');
    })
    .catch(function(error) {
        console.error('Error:', error.message); // In ra thông điệp lỗi
    });
}
////////////////////////////////////voice recognize////////////////////////////////////
let mediaRecorder; // đối tượng MediaRecorder
let chunks = [];   // mảng chứa dữ liệu âm thanh
let stream;        // giữ stream mic

record_button.onclick = async function () {
  console.log("===> record_button clicked");
  console.log("mediaRecorder:", mediaRecorder?.state, "stream:", stream);

  // Nếu chưa ghi âm
  if (!mediaRecorder || mediaRecorder.state === "inactive") {
    console.log(">> Bắt đầu xin quyền micro...");
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    console.log(">> Stream lấy được:", stream);

    mediaRecorder = new MediaRecorder(stream);
    console.log(">> MediaRecorder created, state:", mediaRecorder.state);

    // Khi có dữ liệu
    mediaRecorder.ondataavailable = e => {
      chunks.push(e.data);
      console.log(">> Data available, chunks length:", chunks.length);
    };

    // Khi stop
    mediaRecorder.onstop = async () => {
      console.log(">> mediaRecorder onstop fired");
      const blob = new Blob(chunks, { type: "audio/webm" });
      chunks = [];
      console.log(">> Blob created, size:", blob.size);

      const formData = new FormData();
      formData.append("audio", blob, "speech.webm");

      try {
        console.log(">> Gửi audio lên server...");
        const res = await fetch("https://voice-recognize.onrender.com/stt", {
          method: "POST",
          body: formData
        });
        const data = await res.json();
        console.log(">> Server trả về:", data);

        let text = data.text 
          ? String(data.text).charAt(0).toUpperCase() + String(data.text).slice(1)
          : data.error || "(no speech)";

        text_from_voice.innerText = text;
        kiem_tra_ket_qua_doc("practiceContainer", text);
      } catch (err) {
        console.error(">> Fetch error:", err);
        text_from_voice.innerText = "Error: " + err.message;
      } finally {
        if (stream) {
          console.log(">> Đang tắt micro...");
          stream.getTracks().forEach(track => {
            console.log("   - track stopped:", track.kind);
            track.stop();
          });
          stream = null;
        }
      }
    };

    mediaRecorder.start();
    console.log(">> Ghi âm bắt đầu, state:", mediaRecorder.state);

    startRecording(); // hiệu ứng vòng tròn
    record_button.style.backgroundColor = "#e70826ff";

  } else if (mediaRecorder.state === "recording") {
    console.log(">> Đang dừng ghi âm...");
    mediaRecorder.stop();
    console.log(">> mediaRecorder.stop() called, state:", mediaRecorder.state);
    
    // Ép tắt mic ngay (phòng trường hợp onstop không chạy)
    if (stream) {
      console.log(">> Ép stop micro ngay khi nhấn nút...");
      stream.getTracks().forEach(track => {
        console.log("   - track stopped:", track.kind);
        track.stop();
      });
      stream = null;
    }

    stopRecording();
    record_button.style.backgroundColor = "#2df705";
  }
};
function kiem_tra_ket_qua_doc(parentId, text) {
    const parent = document.getElementById(parentId);
    const children = parent.querySelectorAll("div");
    let confirm=true;
    children.forEach(child => {
      if (child.textContent.trim() === text&&confirm) {
        child.classList.add("fade-out");
        setTimeout(() => child.remove(), 500); // delay bằng transition
        sound_ok.play();
        confirm = false;
      }
    });
  }
function speak(text) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US"; // chọn tiếng Anh Mỹ
    utterance.rate = 0.9;     // đọc hơi chậm lại
    utterance.pitch = 1.2;    // giọng cao một xíu
    speechSynthesis.speak(utterance);
}

let audioContext, analyser, source, dataArray;
let rippleInterval;

async function startRecording() {
  dataArray=[];
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  audioContext = new AudioContext();
  analyser = audioContext.createAnalyser();
  source = audioContext.createMediaStreamSource(stream);
  source.connect(analyser);
  analyser.fftSize = 256;
  dataArray = new Uint8Array(analyser.frequencyBinCount);

  // tạo ripple theo nhịp voice
  function createRipple() {
    analyser.getByteFrequencyData(dataArray);
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
    let volume = sum / dataArray.length;
    // console.log("Volume : ",volume);
    if (volume > 70) { // chỉ tạo ripple khi có tiếng
      const ripple = document.createElement("span");
      ripple.className = "ripple";
      document.getElementById("recordButtonContainer").appendChild(ripple);
      setTimeout(() => ripple.remove(), 200);
    }
  }

  rippleInterval = setInterval(createRipple, 100);
}

function stopRecording() {
  if (audioContext) {
    audioContext.close();
  }
  clearInterval(rippleInterval);
}