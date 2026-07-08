using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class CloudCrafter : MonoBehaviour
{
    [Header("Set in Inspector")]
    public int numClouds=40;
    public GameObject[] cloudPrefabs;

    public Vector3 cloudPosMin = new Vector3(-50, -5, 10);
    public Vector3 cloudPosMax = new Vector3(150,100,10);
    public float cloudScaleMin = 1;
    public float cloudScaleMax=5;
    public float cloudSpeedMult=0.5f;

    public GameObject[] cloudInstances;
    void Awake()
    {
        cloudInstances = new GameObject[numClouds];
        print("start");
        //查找CloudAnchor 父对象
        GameObject anchor = GameObject.Find("CloudAnchor");
        GameObject cloud;
        for (int i = 0; i < numClouds; i++)
        {
            //创建cloudPrefab 实例
            int prefabIndex = Random.Range(0, cloudPrefabs.Length);
            cloud = Instantiate<GameObject>(cloudPrefabs[prefabIndex]);

            Vector3 cPos = Vector3.zero;
            cPos.x = Random.Range(cloudPosMin.x, cloudPosMax.x);
            cPos.y = Random.Range(cloudPosMin.y, cloudPosMax.y);

            float scaleU = Random.value;
            float scaleVal = Mathf.Lerp(cloudScaleMin, cloudScaleMax, scaleU);

            cPos.y = Mathf.Lerp(cloudPosMin.y, cPos.y, scaleU);
            cPos.z = 100 - 90 * scaleU;

            cloud.transform.position = cPos;
            cloud.transform.localScale = Vector3.one * scaleVal;
            cloud.transform.parent = anchor.transform;

            cloudInstances[i] = cloud;
        }
    }
    void Update()
    {
        foreach (GameObject cloud in cloudInstances)
        {
            float scaleVal = cloud.transform.localScale.x;
            Vector3 cPos = cloud.transform.position;
            cPos.x -= scaleVal * Time.deltaTime * cloudSpeedMult;
            if (cPos.x <= cloudPosMin.x)
            {
                cPos.x = cloudPosMax.x;
            }
            cloud.transform.position = cPos;
        }
    }

    // Start is called before the first frame update
    void Start()
    {
        
    }
}
