import React, { useEffect, useState } from "react";
import Papa from "papaparse";
import "./App.css";

function App() {
  const positiveProb = 0.3;
  const neutralProb = 0.3;
  const personProb = 0.33;
  const objectProb = 0.34;

  const [excuseDict, setExcuseDict] = useState(null);
  const [result, setResult] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);


  const randomChoice = (arr) => arr[Math.floor(Math.random() * arr.length)];

  useEffect(() => {
    const loadCSV = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${process.env.PUBLIC_URL}/dictionary1.csv`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const csvData = await response.text();
        
        //用papa解析CSV
        const parsed = Papa.parse(csvData, {
          header: true,
          skipEmptyLines: true,
          dynamicTyping: false,
          transformHeader: (header) => header.trim(), //去除header中的空格
        });

        if (parsed.errors.length > 0) {
          console.warn('CSV解析警告:', parsed.errors);
        }

        //将数据转换为按category分组的字典结构
        const groupedData = {};
        
        parsed.data.forEach(row => {
          //去除空格
          const category = row.category ? row.category.trim() : '';
          const word = row.word ? row.word.trim() : '';
          
          if (category && word) {
            //如果该分类不存在，创建一个新数组
            if (!groupedData[category]) {
              groupedData[category] = [];
            }
            
            //添加内容到对应分类
            groupedData[category].push(word);
          }
        });

        setExcuseDict(groupedData);
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

  // 初次加载生成一次
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
            <div className="box">{result[1]}</div>
            <div className="box">{result[2]}</div>
          </>
        )}
      </div>
      <button className="generate-btn" onClick={handleGenerate}>
        随机生成
      </button>
    </div>
  );
}

export default App;


