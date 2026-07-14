import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const NTAInstructions = ({ test, onStart, onCancel, language, onLanguageChange }) => {
  const [agreed, setAgreed] = useState(false);

  // Common styles to replicate NTA UI
  const ntaBlue = '#005f9b';
  const ntaGreen = '#5cb85c';
  
  return (
    <div className="flex flex-col h-screen bg-white text-black font-sans text-sm" style={{ fontFamily: 'Arial, sans-serif' }}>
      
      {/* Top Header (Logos & Name) */}
      <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-200">
        <div className="flex items-center gap-4">
          {/* Logo 1: 150 Years of Celebrating the Mahatma */}
          <div className="w-16 h-12 flex items-center justify-center">
             <img src="https://nta.ac.in/img/150years.png" alt="150 Years Mahatma" className="h-full object-contain" onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }} />
          </div>
          {/* Logo 2: NTA */}
          <div className="w-48 h-12 flex items-center justify-center">
            <img src="https://nta.ac.in/img/NTA_Logo.png" alt="National Testing Agency" className="h-full object-contain" onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }} />
          </div>
          {/* Logo 3: Ministry of Education */}
          <div className="hidden md:flex w-40 h-12 items-center justify-center border-l pl-4 border-gray-300">
             <img src="https://nta.ac.in/img/MoE_Logo.png" alt="Ministry of Education" className="h-full object-contain" onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }} />
          </div>
        </div>
        <div className="flex items-center">
          {/* Logo 4: Azadi Ka Amrit Mahotsav */}
           <img src="https://nta.ac.in/img/amrit-mahotsav-logo.png" alt="Azadi Ka Amrit Mahotsav" className="h-12 object-contain" onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }} />
        </div>
      </div>

      {/* Blue Action Bar */}
      <div className="bg-[#195a94] text-white px-4 py-1.5 flex justify-between items-center text-xs">
         <div></div> {/* Placeholder for potential left aligned items */}
         <div className="flex items-center gap-4">
           {/* Dropdown for App language (simulate NTA dropdown) */}
           <div className="bg-[#5978b5] rounded px-2 py-1 flex items-center gap-2 cursor-pointer border border-[#3e5f9e]">
              <div className="w-4 h-4 bg-white rounded-full flex items-center justify-center text-[#5978b5] font-bold text-[10px]">A</div>
              <select 
                className="bg-transparent text-white border-none outline-none cursor-pointer appearance-none pr-4"
                value={language === 'en' ? 'English' : 'Hindi'}
                onChange={(e) => onLanguageChange(e.target.value === 'English' ? 'en' : 'hi')}
              >
                <option value="English" className="text-black">English</option>
                <option value="Hindi" className="text-black">Hindi</option>
              </select>
           </div>
           <button className="bg-[#6b479e] rounded-full w-6 h-6 flex items-center justify-center border border-[#52337d]">
              <span className="text-xs">T</span>
           </button>
         </div>
      </div>

      {/* Instructions Title & Default Language Selector */}
      <div className="bg-[#f0f0f0] border-b border-gray-300 px-6 py-3 flex justify-between items-center shadow-sm z-10 relative">
        <h2 className="text-[#00529b] font-bold text-lg tracking-wide">GENERAL INSTRUCTIONS</h2>
        <div className="flex flex-col items-end">
          <label className="text-xs font-bold text-gray-700 mb-1">Choose Your Default Language</label>
          <select 
            className="border border-gray-400 rounded px-2 py-1 text-sm bg-white min-w-[150px]"
            value={language === 'hi' ? 'Hindi' : 'English'}
            onChange={(e) => onLanguageChange(e.target.value === 'Hindi' ? 'hi' : 'en')}
          >
            <option value="English">English</option>
            <option value="Hindi">Hindi</option>
          </select>
        </div>
      </div>

      {/* Main Instructions Content */}
      <div className="flex-1 overflow-y-auto px-10 py-6">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-center font-bold text-lg mb-6">
            {language === 'hi' ? 'कृपया निम्नलिखित निर्देशों को ध्यान से पढ़ें' : 'Please read the instructions carefully'}
          </h3>

          <div className="space-y-4 text-[13px] leading-relaxed text-[#333]">
            <div className="font-bold underline text-sm mb-2">
              {language === 'hi' ? 'सामान्य अनुदेश:' : 'General Instructions:'}
            </div>
            
            <ol className="list-decimal pl-5 space-y-2">
              <li>
                {language === 'hi' ? 
                  `सभी प्रश्नों को हल करने की कुल अवधि ${test?.title || 'Exam'} के लिए ${test?.duration || 180} मिनट है।` : 
                  `Total duration of ${test?.title || 'Exam'} is ${test?.duration || 180} min.`}
              </li>
              <li>
                {language === 'hi' ?
                  'सर्वर पर घड़ी लगाई गई है तथा आपकी स्क्रीन के दाहिने कोने में शीर्ष पर काउंटडाउन टाइमर में आपके लिए परीक्षा समाप्त करने के लिए शेष समय प्रदर्शित होगा। परीक्षा समय समाप्त होने पर, आपको अपनी परीक्षा बंद या जमा करने की जरूरत नहीं है। यह स्वतः बंद या जमा हो जाएगी।' :
                  'The clock will be set at the server. The countdown timer in the top right corner of screen will display the remaining time available for you to complete the examination. When the timer reaches zero, the examination will end by itself. You will not be required to end or submit your examination.'}
              </li>
              <li>
                {language === 'hi' ? 'स्क्रीन के दाहिने कोने पर प्रश्न पैलेट, प्रत्येक प्रश्न के लिए निम्न में से कोई एक स्थिति प्रकट करता है:' : 'The Questions Palette displayed on the right side of screen will show the status of each question using one of the following symbols:'}
                
                <div className="mt-4 space-y-4 pl-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 flex items-center justify-center text-sm font-bold bg-[#e2e2e2] border border-gray-400 rounded-sm">1</div>
                    <span className="pt-1">{language === 'hi' ? 'आप अभी तक प्रश्न पर नहीं गए हैं।' : 'You have not visited the question yet.'}</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 flex items-center justify-center text-sm font-bold text-white bg-red-600 rounded-sm" style={{clipPath: 'polygon(100% 0, 100% 100%, 50% 80%, 0 100%, 0 0)'}}>2</div>
                    <span className="pt-1">{language === 'hi' ? 'आपने प्रश्न का उत्तर नहीं दिया है।' : 'You have not answered the question.'}</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 flex items-center justify-center text-sm font-bold text-white bg-green-600 rounded-sm" style={{clipPath: 'polygon(50% 0%, 100% 20%, 100% 100%, 0 100%, 0 20%)'}}>3</div>
                    <span className="pt-1">{language === 'hi' ? 'आप प्रश्न का उत्तर दे चुके हैं।' : 'You have answered the question.'}</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 flex items-center justify-center text-sm font-bold text-white bg-purple-700 rounded-full">4</div>
                    <span className="pt-1">{language === 'hi' ? 'आपने प्रश्न का उत्तर नहीं दिया है पर प्रश्न को पुनर्विचार के लिए चिह्नित किया है।' : 'You have NOT answered the question, but have marked the question for review.'}</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="relative w-8 h-8 flex items-center justify-center text-sm font-bold text-white bg-purple-700 rounded-full">
                      5
                      <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full w-3.5 h-3.5 flex items-center justify-center border border-white">
                        <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                      </div>
                    </div>
                    <span className="pt-1">{language === 'hi' ? 'प्रश्न जिसका उत्तर दिया गया है और समीक्षा के लिए भी चिह्नित है, उसका मूल्यांकन किया जाएगा।' : 'The question(s) "Answered and Marked for Review" will be considered for evaluation.'}</span>
                  </div>
                </div>
              </li>
              <li className="mt-4">
                {language === 'hi' ?
                  'आप प्रश्न पैलेट को छुपाने के लिए ">" चिन्ह पर क्लिक कर सकते हैं, जो प्रश्न पैलेट के बाईं ओर दिखाई देता है, जिससे प्रश्न विंडो सामने आ जाएगा। प्रश्न पैलेट को फिर से देखने के लिए, "<" चिन्ह पर क्लिक कीजिए जो प्रश्न विंडो के दाईं ओर दिखाई देता है।' :
                  'You can click on the ">" arrow which appears to the left of question palette to collapse the question palette thereby maximizing the question window. To view the question palette again, you can click on "<" which appears on the right side of question window.'}
              </li>
              <li>
                {language === 'hi' ?
                  'सम्पूर्ण प्रश्नपत्र की भाषा को परिवर्तित करने के लिए आपको अपने स्क्रीन के ऊपरी दाहिने सिरे पर स्थित प्रोफाइल इमेज पर क्लिक करना होगा। प्रोफाइल इमेज को क्लिक करने पर आपको प्रश्न के अंतर्वस्तु को इच्छित भाषा में परिवर्तित करने के लिए ड्रॉप-डाउन मिलेगा।' :
                  'You can click on your "Profile" image on top right corner of your screen to change the language during the exam for entire question paper. On clicking of Profile image you will get a drop-down to change the question content to the desired language.'}
              </li>
              <li>
                {language === 'hi' ?
                  'आपको अपने स्क्रीन के निचले हिस्से को स्क्रॉलिंग के बिना नेविगेट करने के लिए ↓ और ऊपरी हिस्से को नेविगेट करने के लिए ↑ पर क्लिक करना होगा।' :
                  'You can click on ↓ to navigate to the bottom and ↑ to navigate to top of the question area, without scrolling.'}
              </li>
            </ol>

            <div className="font-bold underline text-sm mt-6 mb-2">
              {language === 'hi' ? 'प्रश्नों का उत्तर देना :' : 'Answering a Question:'}
            </div>

            <ol className="list-decimal pl-5 space-y-2" start="8">
              <li>
                {language === 'hi' ? 'बहुविकल्पीय प्रकार के प्रश्न के लिए' : 'Procedure for answering a multiple choice type question:'}
                <ol className="list-[lower-alpha] pl-6 mt-1 space-y-1">
                  <li>{language === 'hi' ? 'अपना उत्तर चुनने के लिए, विकल्प के बटनों में से किसी एक पर क्लिक करें।' : 'To select your answer, click on the button of one of the options.'}</li>
                  <li>{language === 'hi' ? 'चयनित उत्तर को अचयनित करने के लिए, चयनित विकल्प पर दुबारा क्लिक करें या Clear Response बटन पर क्लिक करें।' : 'To deselect your chosen answer, click on the button of the chosen option again or click on the Clear Response button'}</li>
                  <li>{language === 'hi' ? 'अपना उत्तर बदलने के लिए, अन्य वांछित विकल्प बटन पर क्लिक करें।' : 'To change your chosen answer, click on the button of another option'}</li>
                  <li>{language === 'hi' ? 'अपना उत्तर सुरक्षित करने के लिए, आपको Save & Next पर क्लिक करना जरूरी है।' : 'To save your answer, you MUST click on the Save & Next button.'}</li>
                  <li>{language === 'hi' ? 'किसी प्रश्न को पुनर्विचार के लिए चिह्नित करने हेतु Mark for Review & Next बटन पर क्लिक करें।' : 'To mark the question for review, click on the Mark for Review & Next button.'}</li>
                </ol>
              </li>
              <li>
                 {language === 'hi' ? 'किसी प्रश्न का उत्तर बदलने के लिए, पहले प्रश्न का चयन करें, फिर नए उत्तर के विकल्प पर क्लिक करने के बाद Save & Next बटन पर क्लिक करें।' : 'To change your answer to a question that has already been answered, first select that question for answering and then follow the procedure for answering that type of question.'}
              </li>
            </ol>
          </div>

          <div className="my-8 border-t border-gray-300"></div>

          <div className="text-[#d9534f] text-sm mb-4">
            {language === 'hi' ? 
              'कृपया ध्यान दें कि सभी प्रश्न आपकी चयनित डिफ़ॉल्ट भाषा में दिखाई देंगे। इस भाषा को बाद में किसी विशेष प्रश्न के लिए बदला जा सकता है।' : 
              'Please note all questions will appear in your default language. This language can be changed for a particular question later on.'}
          </div>

          <div className="border-t border-b border-gray-200 py-4 mb-6">
            <label className="flex items-start gap-3 cursor-pointer">
              <input 
                type="checkbox" 
                className="mt-1 w-4 h-4 cursor-pointer"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
              />
              <span className="text-xs text-gray-700 leading-relaxed text-justify font-bold">
                {language === 'hi' ?
                  'मैंने उपरोक्त सभी निर्देशों को पढ़ और समझ लिया है। मेरे लिए आवंटित सभी कंप्यूटर हार्डवेयर उचित काम करने की स्थिति में हैं। मैं घोषणा करता हूं कि मैं किसी भी प्रकार के निषिद्ध गैजेट जैसे मोबाइल फोन, ब्लूटूथ डिवाइस इत्यादि / परीक्षा हॉल में मेरे साथ किसी भी प्रकार की निषिद्ध सामग्री नहीं है। मैं सहमत हूं कि निर्देशों का पालन न करने के मामले में, मैं इस टेस्ट और अनुशासनात्मक कार्रवाई के लिए उत्तरदायी होऊंगा, जिसमें भविष्य में होने वाले टेस्ट / परीक्षाओं से प्रतिबंध भी शामिल हो सकता है।' :
                  'I have read and understood the instructions. All computer hardware allotted to me are in proper working condition. I declare that I am not in possession of / not wearing / not carrying any prohibited gadget like mobile phone, bluetooth devices etc. /any prohibited material with me into the Examination Hall. I agree that in case of not adhering to the instructions, I shall be liable to be debarred from this Test and/or to disciplinary action, which may include ban from future Tests / Examinations'}
              </span>
            </label>
          </div>

          <div className="flex justify-center mb-10">
            <button
              onClick={onStart}
              disabled={!agreed}
              className={`px-16 py-2.5 font-bold text-white text-sm tracking-wide ${agreed ? 'bg-[#5cb85c] hover:bg-[#4cae4c]' : 'bg-[#a3d7a3] cursor-not-allowed'}`}
              style={{ transition: 'background-color 0.2s' }}
            >
              PROCEED
            </button>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <div className="bg-[#195a94] text-white text-center py-2 text-xs">
        © All Rights Reserved - National Testing Agency
      </div>
    </div>
  );
};

export default NTAInstructions;
