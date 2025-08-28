# -*- coding: utf-8 -*-
import pymysql
import os
import sys
from dotenv import load_dotenv
load_dotenv()

#mysql에 전달받은 데이터를 업로드.
#def sqlUpload(category, id,title,nickname,url,recom,reply,postDate):
def sqlUpload(dataList,category):
    conn = pymysql.connect(
        host=os.getenv('MARIADB_HOST'),
        user=os.getenv('MARIADB_USER'),
        password=os.getenv('MARIADB_PASSWORD'),
        db=os.getenv('MARIADB_DATABASE'),
        charset='utf8mb4',
        use_unicode=True
    )

    cursor = conn.cursor()
    cursor.execute("SET NAMES utf8mb4")

    #카테고리에 따라 다른 table을 사용함
    sql = "REPLACE INTO "

    if(category=="whiskey"):    
        sql = sql + "whiskey_review" + """(id,title,nickname,recom,reply,post_date) 
                VALUES(%s,%s,%s,%s,%s,%s)"""
        cursor.executemany(sql,dataList)
    else:
        sql = sql + "other_review" + """(category,id,title,nickname,recom,reply,post_date) 
                VALUES(%s,%s,%s,%s,%s,%s,%s)"""
        cursor.executemany(sql,dataList)
    
    conn.commit()
    conn.close()
