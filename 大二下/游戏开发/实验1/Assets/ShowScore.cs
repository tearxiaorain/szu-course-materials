using System.Collections;
using System.Collections.Generic;
using System.Numerics;
using TMPro;
using UnityEngine;
using UnityEngine.SocialPlatforms.Impl;

public class ShowScore : MonoBehaviour
{
    [Header("Set Dynamically")]
    public TextMeshProUGUI scoreTS;
    public TextMeshProUGUI scoreHS;
    public TextMeshProUGUI scoreTIP;
    // Start is called before the first frame update
    void Start()
    {
        GameObject scorets = GameObject.Find("ThisScore");
        GameObject scorehs = GameObject.Find("GOHighScore");
        GameObject scoretip = GameObject.Find("Tip");
        scoreTS = scorets.GetComponent<TextMeshProUGUI>();
        scoreHS = scorehs.GetComponent<TextMeshProUGUI>();
        scoreTIP = scoretip.GetComponent<TextMeshProUGUI>();
        scoreTS.text = "Score:" + Basket.scoreGT.text;
        int HS = PlayerPrefs.GetInt("HighScore");
        scoreHS.text = "High Score:" + HS.ToString();
        if (int.Parse(Basket.scoreGT.text) == HS)
        {
            scoreTIP.text = "You break the record!!";
        }
    }

    // Update is called once per frame
    void Update()
    {
        
    }
}
