using System;
using System.Collections;
using System.Collections.Generic;
using TMPro;
using UnityEngine;
using UnityEngine.SocialPlatforms.Impl;

public class AppleTree : MonoBehaviour
{
    [Header("Set in Inspector")]

    public GameObject applePrefab;
    public float speed = 1f;
    public float leftAndRightEdge = 10f;
    public float changeToChangeDirections = 0.1f;
    public float secondsBetweenAppleDrops = 1f;
    public float time0;
    public static int K = 0;

    // Start is called before the first frame update
    void Start()
    {
        Invoke("DropApple", 2f);
        time0 = Time.time;
    }
    void DropApple()
    {
        GameObject apple = Instantiate<GameObject>(applePrefab);
        apple.transform.position = transform.position;
        Invoke("DropApple", secondsBetweenAppleDrops / (K+1));
    }

    // Update is called once per frame
    void Update()
    {
        //基本运动
        Vector3 pos = transform.position;
        pos.x += speed * Time.deltaTime;
        transform.position = pos;

        //改变方向
        if (pos.x < -leftAndRightEdge)
        {
            speed = Mathf.Abs(speed);
        }
        else if (pos.x > leftAndRightEdge)
        {
            speed = -Mathf.Abs(speed);
        }
    }
    private void FixedUpdate()
    {
        //随机改变方向
        if (UnityEngine.Random.value < changeToChangeDirections)
        {
            speed *= -1;
        }
        //实时显示当前难度
        GameObject KV = GameObject.Find("Kvalue");
        TextMeshProUGUI kv = KV.GetComponent<TextMeshProUGUI>();
        
        //改变难度
        float time = Time.time;
        int k = ((int)(time - time0) / 5);
        
        if (K < k)
        {
            K = k;
            speed /= K;
            speed *= (K + 1);
            kv.text = "Level:" + K.ToString();
        }
    }
}
