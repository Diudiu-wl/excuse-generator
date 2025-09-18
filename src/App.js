import React, { useEffect, useRef, useState } from "react";
import Papa from "papaparse";
import "./App.css";

function App() {
  //概率初始为0，等CSV加载后计算
  const [positiveProb, setPositiveProb] = useState(0);
  const [neutralProb, setNeutralProb] = useState(0);
  const [personProb, setPersonProb] = useState(0);
  const [objectProb, setObjectProb] = useState(0);

  const [excuseDict, setExcuseDict] = useState(null);
  const [result, setResult] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);


  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  const buttonRef = useRef(null);
  const panelRef = useRef(null);

  const handleToggle = () => {
    setOpen((prev) => !prev);
    if (!open) setSelected(null); // 打开时重置内容
  };

  const handleSelect = (name) => {
    setSelected(name);
  };

  // 关键：点击页面其他区域关闭面板
  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e) => {
      // 如果点击的区域不在按钮和面板内，则关闭
      if (
        buttonRef.current &&
        !buttonRef.current.contains(e.target) &&
        panelRef.current &&
        !panelRef.current.contains(e.target)
      ) {
        setOpen(false);
        setSelected(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);



  const randomChoice = (arr) => arr[Math.floor(Math.random() * arr.length)];

  //根据字典计算概率
  const computeProbs = (dict) => {
    const positive_prob_weight = 1;
    const neutral_prob_weight = 1;
    const person_prob_weight = 1;
    const object_prob_weight = 1;

    const num_special = (dict.special || []).length;
    const num_person_pos = (dict.positive_person_nouns || []).length *
      ((dict.positive_person_decorations || []).length +
       (dict.positive_neutral_decorations || []).length);
    const num_obj_pos = (dict.positive_object_nouns || []).length *
      ((dict.positive_object_decorations || []).length +
       (dict.positive_neutral_decorations || []).length);
    const num_person_neg = (dict.negative_person_nouns || []).length *
      ((dict.negative_person_decorations || []).length +
       (dict.negative_neutral_decorations || []).length);
    const num_obj_neg = (dict.negative_object_nouns || []).length *
      ((dict.negative_object_decorations || []).length +
       (dict.negative_neutral_decorations || []).length);

    const num_neutral =
      (dict.positive_neutral_decorations || []).length *
        ((dict.positive_person_nouns || []).length + (dict.positive_object_nouns || []).length) +
      (dict.negative_neutral_decorations || []).length *
        ((dict.negative_person_nouns || []).length + (dict.negative_object_nouns || []).length);

    const total_combinations =
      num_special + num_person_pos + num_obj_pos + num_person_neg + num_obj_neg;

    const positive_p =
      positive_prob_weight * (num_person_pos + num_obj_pos) / total_combinations;
    const neutral_p =
      neutral_prob_weight * num_neutral / total_combinations;
    const person_p =
      person_prob_weight * (num_person_pos + num_person_neg) / total_combinations;
    const object_p =
      object_prob_weight * (num_obj_pos + num_obj_neg) / total_combinations;

    setPositiveProb(positive_p);
    setNeutralProb(neutral_p);
    setPersonProb(person_p);
    setObjectProb(object_p);
  };

  useEffect(() => {
    const loadCSV = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${process.env.PUBLIC_URL}/dictionary.csv`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const csvData = await response.text();
        const parsed = Papa.parse(csvData, {
          header: true,
          skipEmptyLines: true,
          dynamicTyping: false,
          transformHeader: (header) => header.trim(),
        });

        if (parsed.errors.length > 0) {
          console.warn('CSV解析警告:', parsed.errors);
        }

        const groupedData = {};
        parsed.data.forEach(row => {
          const category = row.category ? row.category.trim() : '';
          const word = row.word ? row.word.trim() : '';
          if (category && word) {
            if (!groupedData[category]) groupedData[category] = [];
            groupedData[category].push(word);
          }
        });

        setExcuseDict(groupedData);
        computeProbs(groupedData);   // 计算概率
        setError(null);
      } catch (err) {
        console.error('加载CSV文件失败:', err);
        setError(`加载CSV文件失败: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    loadCSV();
  }, []);


  const makeSpecial = () => ["special", randomChoice(excuseDict.special)];

  const makePersonExcuse = () => {
    const nounProb = Math.random();
    const wordProb = Math.random();
    let noun, word, cat;
    if (nounProb < positiveProb) {
      noun = randomChoice(excuseDict.positive_person_nouns);
      word = wordProb < neutralProb
        ? randomChoice(excuseDict.positive_neutral_decorations)
        : randomChoice(excuseDict.positive_person_decorations);
      cat = "positive";
    } else {
      noun = randomChoice(excuseDict.negative_person_nouns);
      word = wordProb < neutralProb
        ? randomChoice(excuseDict.negative_neutral_decorations)
        : randomChoice(excuseDict.negative_person_decorations);
      cat = "negative";
    }
    return [cat, noun, word];
  };

  const makeObjectExcuse = () => {
    const nounProb = Math.random();
    const wordProb = Math.random();
    let noun, word, cat;
    if (nounProb < positiveProb) {
      noun = randomChoice(excuseDict.positive_object_nouns);
      word = wordProb < neutralProb
        ? randomChoice(excuseDict.positive_neutral_decorations)
        : randomChoice(excuseDict.positive_object_decorations);
      cat = "positive";
    } else {
      noun = randomChoice(excuseDict.negative_object_nouns);
      word = wordProb < neutralProb
        ? randomChoice(excuseDict.negative_neutral_decorations)
        : randomChoice(excuseDict.negative_object_decorations);
      cat = "negative";
    }
    return [cat, noun, word];
  };

  const generate = () => {
    const catProb = Math.random();
    if (catProb < personProb) return makePersonExcuse();
    if (catProb < personProb + objectProb) return makeObjectExcuse();
    return makeSpecial();
  };

  const handleGenerate = () => {
    if (!excuseDict) return;
    setResult(generate());
  };

  useEffect(() => {
    if (excuseDict) handleGenerate();
  }, [excuseDict]);

  if (!excuseDict) return <div className="app">加载中...</div>;

  const isSpecial = result[0] === "special";

  
  return (
    <div className="App">
      <h1>喷喷借口生成器</h1>
      <div className="boxes-container">
        {isSpecial ? (
          <>
            <div className="single box">{result[1]}</div>
            
          </>
        ) : (
          <>
            <div className="left box">{result[1]}</div>
            <div className="right box">{result[2]}</div>
          </>
        )}
      </div>
      <button className="generate-btn" onClick={handleGenerate}>
        随机生成
      </button>

    <button
        ref={buttonRef}
        className="about-button"
        onClick={handleToggle}
      >
        关于作者
      </button>

      {open && (
        <div
          ref={panelRef}
          className={`about-panel ${selected ? "about-panel-expanded" : ""}`}
        >
          {!selected && (
            <div className="link-list">
              <p onClick={() => handleSelect("arainwong")}>arainwong</p>
              <p onClick={() => handleSelect("tapioca")}>tapioca</p>
            </div>
          )}

          {/*
          {selected === "arainwong" && (
            <div className="detail">
              <p>arainwong (Ω7):</p>
              <video
                className="media" 
                src={`${process.env.PUBLIC_URL}/images/arainwong.mp4`}  
                autoPlay              
                loop                  
                muted                 
                playsInline          
              />
              <p>畅玩斯普拉遁，感悟痛苦人生。</p>
               
              <a href="https://github.com/arainwong" target="_blank" rel="noopener noreferrer" className="github-button">
              <img src="https://cdn-icons-png.flaticon.com/512/25/25231.png" alt="GitHub Logo" />
              Follow Me
              </a>
            </div>
          )}
          */}


          {selected === "arainwong" && (
            <div className="detail">
              <p>arainwong (Ω7):</p>
              <img src={`${process.env.PUBLIC_URL}/images/arian.gif`} alt="arianwong" />
              <p>我没素质啊啊。</p>
               {/* 这里是 GitHub 关注按钮 */}
              <a href="https://github.com/arainwong" target="_blank" rel="noopener noreferrer" className="github-button">
              <img src="https://cdn-icons-png.flaticon.com/512/25/25231.png" alt="GitHub Logo" />
              Follow Me
              </a>
            </div>
          )}

          {selected === "tapioca" && (
            <div className="detail">
              <p>tapioca:</p>
              <img src={`${process.env.PUBLIC_URL}/images/tapioca.jpeg`} alt="tapioca" />
              <p>日常破防的鱿鱼。</p>
               {/* 这里是 GitHub 关注按钮 */}
              <a href="https://github.com/Diudiu-wl" target="_blank" rel="noopener noreferrer" className="github-button">
              <img src="https://cdn-icons-png.flaticon.com/512/25/25231.png" alt="GitHub Logo" />
              Follow Me
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;



