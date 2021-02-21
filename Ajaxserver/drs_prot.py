# -*- coding: utf-8 -*-
"""drs_prot.ipynb

Automatically generated by Colaboratory.

Original file is located at
    https:\\colab.research.google.com\drive\1tESYnki6lZXnm7DvTY8n67xR6b5rlQN-

# Import
"""

import warnings
warnings.simplefilter(action='ignore', category=FutureWarning)

import pandas as pd
import numpy as np
import re
import os
import copy
#import tensorflow as tf
import pprint

import MeCab

from gensim.models import Word2Vec
from sklearn.multiclass import OneVsRestClassifier
from sklearn import svm, decomposition
from sklearn.svm import SVC
from sklearn.decomposition import PCA

from joblib import dump,load

"""# Programs

## Parsing Input
"""
#文章を文単位で分割
def parse_Paragraph(paragraph):
  if not re.match('.*[。|．|\. ]', paragraph):
    paragraph = paragraph+'。'
  sentences = re.split('。|．|\. ', paragraph)
  #sentences = [re.sub(',|, |，', '、',s) for s in sentences]
  res = [s+'。' for s in sentences][:-1]
  return res

#mecabで文を分かち書き
def parse_Sentence(sentence):
  m = MeCab.Tagger("-Ochasen")
  parsed = m.parse(sentence)
  return parsed

#含まれる文を全て分かち書きした文章
def parse_Parag_to_Word(paragraph):
  sentences = parse_Paragraph(paragraph)
  word_parsed_paragraph = [[p.split('\t') for p in parse_Sentence(s).split('\n')[:-2]] for s in sentences]
  #print(word_parsed_paragraph)
  return word_parsed_paragraph

"""## 要素分類(import Parsing Input)
"""### 主成分分析"""
def pca_vec(vec):
  vec_ = np.array([vec[:,n] for n in range(len(vec[0])-1)])
  pca = decomposition.PCA(n_components=1)
  vec_transformed = pca.fit_transform(vec_)
  return vec_transformed[:,0]

"""### mecabの分かち書きからベクトル生成"""
def make_vec(sentence, wv_model):
  words = []
  for n in range(len(sentence)-1):
    for w in [sentence[n][0]]:
      try:
        words.append(wv_model.wv[w])
      except KeyError:
        print(w,"was not in vocabulary. And ignored.")
  vec = np.array(words)
  #vec = np.array([wv_model.wv[w] for w in [sentence[n][0] for n in range(len(sentence)-1)]])
  return pca_vec(vec)

"""### Prediction"""
#文単位で分割された文章を入力　推測の結果をリストで返す
def predict_Sentence_attr(vec, model):
  prediction = model.predict(vec).astype(int)
  ##print(prediction[0])
  prediction = np.where(prediction==0, 'claim', prediction)
  prediction = np.where(prediction=='-1', 'ground', prediction)
  prediction = np.where(prediction=='1', 'ground', prediction)
  prediction = np.where(prediction=='2', 'ground', prediction)
  return prediction.tolist()

def Content_Classification(paragraph, wv_model, sentence_attr_model):
  parsed = parse_Parag_to_Word(paragraph)
  arr_attr = []
  for p in parsed:
    vec = make_vec(p, wv_model)
    arr_attr.append(predict_Sentence_attr(vec.reshape(1,-1), sentence_attr_model)[0])
  return arr_attr

"""### 加点行列をつくる"""
def Content_addmat(arr_content, matsize, df_Content_points):
  if len(arr_content) > matsize:
    arr_content = arr_content[:matsize]
  points_mat = np.zeros((matsize, matsize), dtype=int)
  for i in range(matsize):
    for j in range(i+1, matsize):
      if i != j:
        res = df_Content_points[df_Content_points['from']==arr_content[i]]
        res = res[res['to']==arr_content[j]]
        points_mat[i][j] = res["point"]+i-j+1
        #points_mat[j][i] = res["point"]+i-j+1
  return points_mat


"""## 接続詞(import Parsing Input, 要素分類)
"""### 文頭の接続詞から属性探索"""
def search_Conjuction(df_attr, sentence):
  if '接続詞' in sentence[0][3]:
    query = 'word == \"'+sentence[0][0]+'\"'
    arr_attr = df_attr.query(query)
    ##print(sentence[0][0]," is ", arr_attr["attr"].tolist())
    return arr_attr
  else:
    return 0

#sentence = parse_Parag_to_Word("なんだかやる気が出ないお。よって、私は飯を食い床に就く。")
#search_Conjuction(df_conjuction_attr, sentence[1])

"""### 属性からルール探索"""
def search_Rules(df_rules, attr):
  arr_rules = pd.DataFrame()
  if attr is not 0:
    query = 'attr == \"'+attr['attr']+'\"'
    res = df_rules.query(query)
    arr_rules = pd.concat([arr_rules,res], axis=0)
  return arr_rules  

"""### 語単位の加点"""
def search_Priority(df_priorities, word):
  #print(df_priorities)
  #print(type(df_priorities))
  query = 'word == \"'+word+'\"'
  res = df_priorities.query(query)
  #print(res)
  priority = int(res['point'].values[0])
  #print('priority: ',priority)
  return priority

"""### 加点行列をつくる"""
#search_ConjuctionからDataFrame.iterrows()でiterateしてattrでrsearch_Rulesから抽出適用・構造候補の加点行列を作る
def Conjuction_addmat(rules, matsize, cur, arr_attr, priority):
  points_mat = np.zeros((matsize, matsize), dtype=int)
  rules['from_start'] = rules['from_start'].fillna(-cur)
  rules['from_end'] = rules['from_end'].fillna(-cur)
  rules['to_start'] = rules['to_start'].fillna(-cur)
  rules['to_end'] = rules['to_end'].fillna(matsize)
#  #print(rules)
  for index, rule in rules.iterrows():
#    #print(rule)
    point = int(abs(rule['point'])*(priority))
    adder_fromstart = cur + int(rule['from_start'])
    adder_fromend = cur + int(rule['from_end'])+1
    adder_tostart = cur + int(rule['to_start'])
    adder_toend = cur + int(rule['to_end'])+1
    
    if np.isnan(rule['if_loc']) != True:
      #print("drs-prot:158\n",rule,"\n", cur+int(rule['if_loc']), arr_attr)
      if cur+int(rule['if_loc']) < matsize:
        if arr_attr[cur+int(rule['if_loc'])] == rule['if_is']:
          ##print(point,"points [",adder_fromstart,":",adder_fromend,"] to [",adder_tostart,":",adder_toend,"] with \"", rules['attr'].tolist()[0],"\"")
  #        #print(points_mat[adder_fromstart:adder_fromend][adder_tostart:adder_toend])
          points_mat[adder_fromstart:adder_fromend,adder_tostart:adder_toend] += point
          #points_mat[adder_tostart:adder_toend,adder_fromstart:adder_fromend] += point
    else:
      ##print(point,"points [",adder_fromstart,":",adder_fromend,"] to [",adder_tostart,":",adder_toend,"] with \"", rules['attr'].tolist()[0],"\"")
      points_mat[adder_fromstart:adder_fromend,adder_tostart:adder_toend] += point
      #points_mat[adder_tostart:adder_toend,adder_fromstart:adder_fromend] += point
#    #print(points_mat,"\n")
  return points_mat

#Conjuction_addmat(rules, 5, 3, ["ground", "ground", "ground", "ground", "claim"])

def Paragraph_to_Conjuction_addmat(df_conjuction_attr, df_conjuction_points, sentences, arr_content, df_conjuction_priority_arr):
  len_sentence = len(sentences)
  addmat = np.zeros((len(sentences), len(sentences)), dtype=int)
  cases = pd.DataFrame({'matrix':[addmat], 'label':['']})

  def makemat(s, attr):
    word = attr['word']
    attribute = attr['attr']
    label = str(str(s+1)+"文目:「"+word+"」が"+attribute+"\n")
    df_attr_priority = df_conjuction_priority_arr[attribute]
    priority = search_Priority(df_attr_priority, word)

    #接続関係とルールのマッチング
    rules = search_Rules(df_conjuction_points, attr)
    mat = Conjuction_addmat(rules, len_sentence, s, arr_content, priority)
    #pprint.pprint(mat)
    return label, mat
    
  for s in range(len_sentence):
    #単語と接続関係のマッチング
    arr_attr = search_Conjuction(df_conjuction_attr, sentences[s])
    if type(arr_attr) is not int:
        base0 = cases.copy()
        cases.drop(cases.index, inplace=True)
        for index, attr in arr_attr.iterrows():
            label, matrix = makemat(s, attr)    
            base1 = base0.copy()
            base1['matrix'] = base1['matrix'].map(lambda x: x + matrix)
            base1['label'] = base1['label'].map(lambda x: x + label)
            cases = pd.concat([cases, base1])
  return cases


"""## 指示語"""
def Directive_addmat(sentences, matsize, point):
  points_mat = np.zeros((matsize, matsize), dtype=int)
  for s in range(1,len(sentences)):
    if re.match("この|あの|その|これ|それ",sentences[s][0][0]):
      ##print(sentences[s][0][0], " in ", s, "文目")
      points_mat[s-1][s] += point
      #points_mat[s][s-1] += point
  ##print(points_mat)
  return points_mat

"""## キーワード"""
def Keyword_addmat(sentences, matsize, df_keywords):
  points_mat = np.zeros((matsize, matsize), dtype=int)
  for s in range(len(sentences)-1):
    for index, row in df_keywords.iterrows():
      keyword = row["word"]
      point = row["point"]
      for w in sentences[s]:
        if keyword in w[0]:
          ##print(keyword, " in ", s, "文目")
          points_mat[s+row["from"] if s+row["from"]>=0 else 0][s+row["to"]] += point
          #points_mat[s+row["to"]][s+row["from"]] += point
  ##print(points_mat)
  return points_mat


"""## 共通の単語"""
def Commonword_addmat(sentences, matsize, df_exeptwords, coef, thres):
  points_mat = np.zeros((matsize, matsize), dtype=int)
  per_mat = np.zeros((matsize, matsize), dtype=float)
  arr_exeptword = df_exeptwords["word"].tolist()

  def extract_words(sentence):
    s =[]
    for w in sentence:
     if re.match('名詞|動詞|形容詞|形容動詞', w[3]):
       s.append(w[0])
    sentence_words = list(set(s) - set(arr_exeptword))
    return sentence_words

  def compare_sentences(sentence1, sentence2):
    arr_commonwords = list(set(sentence1) & set(sentence2))
    meanlength = (len(sentence1) + len(sentence2)) / 2
    percentage = len(arr_commonwords) / meanlength
    ##一致率*係数=点数
    #point = int(percentage * coef)
    ##一致率>閾値=点数
    if percentage >= thres:
      point = coef
    else:
      point = 0

    return point, percentage

  for s1 in range(matsize-1):
    sentence_words1 = extract_words(sentences[s1])
    for s2 in range(s1+1, matsize):
      sentence_words2 = extract_words(sentences[s2])
      point, percentage = compare_sentences(sentence_words1, sentence_words2)
      per_mat[s1,s2] = percentage
      #per_mat[s2,s1] = percentage

      if point > 0:
        ##print(s1+1, "文目と", s2+1, "文目の一致率: ", percentage)
        points_mat[s1,s2] = point
        #points_mat[s2,s1] = point
  ##print(points_mat)
  ##print(per_mat)
  return points_mat




"""# main"""
print(os.chdir(os.path.dirname(os.path.abspath(__file__))))
#要素分類
##点数
path_Content_points = "..\data\data_prot\Rules\Content_points.csv"
df_Content_points = pd.read_csv(path_Content_points)
##要素分類モデル
path_sentence_attr_model = "..\data\model_svc.model"
sentence_attr_model = load(path_sentence_attr_model)
##w2vモデル
path_wv_model = "..\data\word2vec.model"
wv_model = load(path_wv_model)

#接続詞
##接続関係と点数
path_Conjuction_attr =  "..\data\data_prot\Rules\Conjuction_attr.csv"
path_Conjuction_points =  "..\data\data_prot\Rules\Conjuction_points.csv"
###付加の接続詞
path_Conjuction_priority_Add = "..\data\data_prot\Rules\Conjuction_priority_Add.csv"
###譲歩
path_Conjuction_priority_Conc = "..\data\data_prot\Rules\Conjuction_priority_Conc.csv"
###対比
path_Conjuction_priority_Cont = "..\data\data_prot\Rules\Conjuction_priority_Cont.csv"
###転換
path_Conjuction_priority_Conv = "..\data\data_prot\Rules\Conjuction_priority_Conv.csv"
###例示
path_Conjuction_priority_Exem = "..\data\data_prot\Rules\Conjuction_priority_Exem.csv"
###解説
path_Conjuction_priority_Exp = "..\data\data_prot\Rules\Conjuction_priority_Exp.csv"
###制限
path_Conjuction_priority_Rest = "..\data\data_prot\Rules\Conjuction_priority_Rest.csv"
##山本 和英, 齋藤 真実の分類
#path_Conjuction_attr_yamamoto =  "..\data\data_prot\Yamamoto_Rules\Conjuction_attr.csv"
#path_Conjuction_points_yamamoto =  "..\data\data_prot\Yamamoto_Rules\Conjuction_points.csv"
df_conjuction_attr = pd.read_csv(path_Conjuction_attr)
df_conjuction_points = pd.read_csv(path_Conjuction_points)
df_conjuction_priority_Add = pd.read_csv(path_Conjuction_priority_Add)
#print(df_conjuction_priority_Add)
#print(type(df_conjuction_priority_Add))
df_conjuction_priority_Conc = pd.read_csv(path_Conjuction_priority_Conc)
df_conjuction_priority_Cont = pd.read_csv(path_Conjuction_priority_Cont)
df_conjuction_priority_Conv = pd.read_csv(path_Conjuction_priority_Conv)
df_conjuction_priority_Exem = pd.read_csv(path_Conjuction_priority_Exem)
df_conjuction_priority_Exp = pd.read_csv(path_Conjuction_priority_Exp)
df_conjuction_priority_Rest = pd.read_csv(path_Conjuction_priority_Rest)
df_conjuction_priority_arr = {
  '付加': df_conjuction_priority_Add,
  '譲歩': df_conjuction_priority_Conc,
  '対比': df_conjuction_priority_Cont,
  '転換': df_conjuction_priority_Conv,
  '例示': df_conjuction_priority_Exem,
  '解説': df_conjuction_priority_Exp,
  '制限': df_conjuction_priority_Rest
}
#print((df_conjuction_priority_arr['付加']))

#指示代名詞
#キーワード
##単語一覧
path_Keywords = "..\data\data_prot\Rules\Keywords.csv"
df_keywords = pd.read_csv(path_Keywords)

#共通の単語
##単語一覧
path_Exeptwords = "..\data\data_prot\Rules\Exeptwords.csv"
df_exeptwords = pd.read_csv(path_Exeptwords)
##点数
commonwords_coef = 3
##閾値
commonwords_thres = 0.5

#生の文章(paragraph)と結論の位置(target)から点数を出す
def Point_matrix(paragraph, target):

  def Reshape_sentence(sentences):
    words = []
    i=1  
    for sentence in sentences:
      words.append(""+str(i)+". "+''.join([w for w in [sentence[n][0] for n in range(len(sentence)-1)]]))
      i+=1
    return words

  #print(paragraph, target)

  #文を分かち書き
  sentences = parse_Parag_to_Word(paragraph)
  len_sentence = len(sentences)
  if target == -1:
    return [], [], [], [], Reshape_sentence(sentences)

  #文章の頭から指定の文まで抜き出し
  sentence_full = copy.copy(sentences)
  if len_sentence >= target:
    sentences_ = sentences[:target]
    len_sentence = len(sentences)
  elif target > len_sentence:
    sentences_ = sentences
    target = len_sentence
  
  words = Reshape_sentence(sentences_)
  sentence_full = Reshape_sentence(sentence_full)

  #w2vモデルの再訓練\セーブ
  #wv_model.train(words, total_examples = sum([len(w) for w in words]), epochs = wv_model.iter)

  #点数の行列
  points_mat = np.array([[50]*target for i in range(target)])

  #要素分類
  print("---------------要素分類------------------------------------------------")
  arr_content = Content_Classification(paragraph, wv_model, sentence_attr_model)[:-1]
  arr_content.append('claim')
  #arr_content = ["ground", "ground", "ground", "claim", "claim", "claim", "claim", "claim", "ground", "claim"]
  content_addmat = Content_addmat(arr_content, target, df_Content_points)
  print(arr_content,"\n",content_addmat)
  points_mat += content_addmat

  #指示代名詞
  ##print("---------------指示代名詞------------------------------------------------")
  #directive_addmat = Directive_addmat(sentences_, target, directive_point)
  #points_mat += directive_addmat
  
  #他キーワード+指示語
  print("---------------キーワード------------------------------------------------")
  keyword_addmat = Keyword_addmat(sentences_, target, df_keywords)
  points_mat += keyword_addmat
  print(keyword_addmat)

  #共通の単語
  print("---------------共通の単語------------------------------------------------")
  commonword_addmat = Commonword_addmat(sentences_, target, df_exeptwords, commonwords_coef, commonwords_thres)
  points_mat += commonword_addmat
  print(commonword_addmat)

  #接続詞の加点行列
  print("---------------接続詞------------------------------------------------")
  conjuction_addmat = Paragraph_to_Conjuction_addmat(df_conjuction_attr, df_conjuction_points, sentences_, arr_content, df_conjuction_priority_arr)
  conjuction_addmat['matrix'] = conjuction_addmat['matrix'].map(lambda x: x + points_mat)
  print(conjuction_addmat)
  print("---------------------------------------------------------------------")
  
  res_mat = []
  res_label = []
  i = 0
  for index, row in conjuction_addmat.iterrows():
    print(row['label'],row['matrix'],"\n")
    res_mat.append(row['matrix'].tolist())
    res_label.append(row['label'])
    i+=1
 

  return res_mat, res_label, words, arr_content, sentence_full

  
if __name__ == '__main__':
  print(Point_matrix("グラフを見ると、バッファサイズが非常に小さいときファイルサイズが大きいと非常に時間がかかっている。またread/writeの方がrecv/sendより僅かの差だが、多くの時間を要している。そして、バッファサイズを大きくしていっても、同様にread/writeがrecv/sendより速くなることはなかった。この要因は、ファイルの通信処理はソケットを用いて通信した方が速くなるからであると考える。", 10))