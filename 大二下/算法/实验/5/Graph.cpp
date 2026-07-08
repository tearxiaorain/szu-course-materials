#include <iostream>
#include <vector>
#include <utility>
#include <algorithm>
#include <fstream>
#include <string>
#include <climits>
#include <chrono>
#include <queue>

using namespace std;

int N = 0;
int E = 0;
int CIRCLE_NUM = 0;  //生成树上的原图的环边
int NOT_TREE_NUM = 0; //原图的非树边
int TREE_NUM = 0;
int TOTAL_NUM = 0;
int* union_connect;  //并查集数组，用于判断联通分量
int* union_root;  //并查集数组，用于存生成树的子节点的树根

int* edge;  //以点代边数组  存生成树
int* Eflag; //记录生成树的边是否是原图的环边
vector<pair<int, int>> not_tree_edge;
int* nte_1;
int* nte_2;

int* deepth;

// 并查集初始化
void union_reset(int *arr)
{
    for (int i = 0; i < N; i++)
    {
        arr[i] = i;
        deepth[i] = 0;
    }
}

// 并查集查找
int union_find(int *arr,int u)
{
    int r = u;
    if (arr[u] != u)
    {
        r = union_find(arr, arr[u]);
        arr[u] = r; //路径压缩
    }
    return r;
}

// 并查集合并
void union_merge(int *arr,int u, int v)
{
    int ru = union_find(arr,u);
    int rv = union_find(arr,v);
    if (u == v)
    {
    }
    else
    {
        arr[rv] = ru;
    }
    return;
}

void set_deepth()
{
    for (int i = 0; i < N; i++)
    {
        int d = 0;
        int temp = edge[i];
        while (temp != -1)
        {
            d++;
            temp = edge[temp];
        }
        deepth[i] = d;
    }
}

int union_LCA(int u, int v)
{
    int r = u;
    if (u == v)
        return r;

    int du = deepth[u];
    int dv = deepth[v];

    if (du > dv)
    {
        r = union_LCA(edge[u], v);
    }
    else if (du < dv)
    {
        r = union_LCA(edge[v], u);
    }
    else
    {
        r = union_LCA(edge[u], edge[v]);
    }
    return r;
}

class Graph 
{
    int V; // 顶点数量
    vector<vector<int>> adj; // 邻接表

public:
    Graph(int V) : V(V), adj(V) {}

    // 添加无向边
    void addEdge(int u, int v) 
    {
        adj[u].push_back(v);
        adj[v].push_back(u);
    }

    // 计算连通分量数量（使用DFS）
    int countConnectedComponents() 
    {
        vector<bool> visited(V, false);
        int count = 0;

        for (int i = 0; i < V; ++i) 
        {
            if (!visited[i]) 
            {
                dfs(i, visited);
                count++;
            }
        }
        return count;
    }

    // 蛮力法查找所有桥
    vector<pair<int, int>> findBridgesBruteForce() 
    {
        vector<pair<int, int>> bridges;
        int originalComponents = countConnectedComponents(); //记录初始联通分量数

        // 遍历所有边
        for (int u = 0; u < V; ++u) 
        {
            vector<int> temp;
            for (int t : adj[u]) 
            {
                temp.push_back(t);
            }
            for (int v : temp) 
            {
                // 避免重复检查无向边
                if (u > v) continue;

                // 临时删除边(u,v)
                removeEdge(u, v);
                // 检查连通分量是否增加
                if (countConnectedComponents() > originalComponents) 
                {
                    bridges.emplace_back(u, v);
                }
                // 恢复边
                restoreEdge(u, v);
            }
        }
        return bridges;
    }

    void tree_union(Graph& gT)
{
    for (int i = 0; i < N; i++)
    {
        for (auto& e : adj[i])
        {
            if (i < e)
            {
                if (union_find(union_connect,i) != union_find(union_connect,e))
                {
                    union_merge(union_connect, i, e);
                    gT.addEdge(i, e);
                    TREE_NUM++;
                }
                else
                {
                    nte_1[NOT_TREE_NUM] = i;
                    nte_2[NOT_TREE_NUM] = e;
                    NOT_TREE_NUM++;
                }
            }
        }
    }
}

    void tree_bfs()
{
    //union_reset(union_root);
    vector<bool> visited(V, false);
    //queue<pair<int,int>> te;

    while (1)
    {
        int r = find_first(visited);
        if (r == N)
        {
            break;
        }
        
        deepth[r] = 0;
        queue<int> ne;
        visited[r] = true;
        ne.push(r);
        while (!ne.empty())
        {
            int f = ne.front();
            ne.pop();
            for (auto& e : adj[f])
            {
                if (!visited[e])
                {
                    edge[e] = f;
                    deepth[e] = deepth[f] + 1;
                    TREE_NUM++;
                    visited[e] = true;
                    ne.push(e);
                }
                else
                {
                    if (edge[f] != e)
                    {
                        if (f < e)
                        {
                            //not_tree_edge.emplace_back(f, e);
                            nte_1[NOT_TREE_NUM] = f;
                            nte_2[NOT_TREE_NUM] = e;
                            NOT_TREE_NUM++;
                        }
                    }
                }
            }
        }
    }
    


    /*while (1)
    {
        int f = find_first(visited);
        if (f == N)
            break;

        for (auto& e : adj[f])
        {
            if (!visited[e])
            {
                te.emplace(f, e);
                visited[e] = true;
            }
            else
            {
                not_tree_edge.emplace_back(f, e);
                NOT_TREE_NUM++;
            }
        }
        visited[f] = true;
    }

    while (!te.empty())
    {
        edge[te.front().second] = te.front().first;

        te.pop();
    }*/
}

int find_first(vector<bool> visited)
{
    int f = 0;
    while (f<N)
    {
        if (!visited[f])
        {
            break;
        }
        f++;
    }
    return f;
}

    void tree_dfs()
    {
        union_reset(union_root);
        vector<bool> visited(V, false);

        for (int i = 0; i < V; ++i)
        {
            cout<<i<<endl;
            if (!visited[i])
            {
                dfsadd(i, visited);   
            }
            cout<<i<<endl;
        }

        

        //int* tflag = new int[N];
        //for (int i = 0; i < N; i++)
        //{
        //    tflag[i] = 0;
        //}

        //for (int i = 0; i < N; i++)
        //{
        //    for (int j : adj[i])
        //    {
        //        if (tflag[j])
        //        {
        //            continue;
        //        }

        //        int ri = union_find(union_root,i);
        //        int rj = union_find(union_root,j);
        //        if (ri == rj)  //在同一颗树上，成环边,非树边
        //        {
        //            not_tree_edge.emplace_back(i, j);
        //            NOT_TREE_NUM++;
        //        }
        //        else  //不在同一颗树上
        //        {
        //            edge[j] = i;  //生成树的节点的值为父节点
        //            TREE_NUM++;
        //            union_merge(union_root, i, j);
        //        }
        //    }
        //    tflag[i]++;
        //}

    }

private:
    // DFS辅助函数
    void dfs(int u, vector<bool>& visited) 
    {
        visited[u] = true;
        for (int v : adj[u]) 
        {
            if (!visited[v]) 
            {
                dfs(v, visited);
            }
        }
    }

    void dfsadd(int u, vector<bool>& visited)
    {
        visited[u] = true;
        for (int v : adj[u])
        {
            cout<<u<<" - "<<v<<endl;
            if (!visited[v])
            {
                edge[v] = u;
                //union_merge(union_root, u, v);
                TREE_NUM++;
                dfsadd(v, visited);
            }
            else
            {
                if (edge[u] != v) //(u, v)不在生成树中，是非树边
                {
                    if (u < v)
                    {
                        not_tree_edge.emplace_back(u, v);
                        NOT_TREE_NUM++;
                    }
                }
            }
        }
    }

    // 临时删除边
    void removeEdge(int u, int v) 
    {
        adj[u].erase(remove(adj[u].begin(), adj[u].end(), v), adj[u].end());
        adj[v].erase(remove(adj[v].begin(), adj[v].end(), u), adj[v].end());
    }

    // 恢复边
    void restoreEdge(int u, int v) 
    {
        adj[u].push_back(v);
        adj[v].push_back(u);
    }
};



void edge_reset()
{
    for (int i = 0; i < N; i++)
    {
        edge[i] = -1;
    }
}

void Eflag_reset()
{
    for (int i = 0; i < N; i++)
    {
        Eflag[i] = 0;
    }
}

void set_Ef_path(int u, int r)
{
    if (u == r)
    return;
    int temp = u;
    while (temp != r)
    {
        if (!Eflag[temp])
        {
            CIRCLE_NUM++;
            Eflag[temp]++;
        }
        int t = temp;
        temp = edge[temp];
        if (t != r)
        {
            edge[t] = r;
            deepth[t] = deepth[r] + 1;
        }
    }
    return;
}

void set_Ef()
{
    // for (auto& e : not_tree_edge)
    // {
    //     int u = e.first;
    //     int v = e.second;
    //     int r = union_LCA(u, v);
    //     set_Ef_path(u, r);
    //     set_Ef_path(v, r);
    //     edge[u] = edge[v] = r;
    //     deepth[u] = deepth[v] = deepth[r] + 1;
    // }
    for (int i = 0; i < NOT_TREE_NUM; i++)
    {
        int u = nte_1[i];
        int v = nte_2[i];
        int r = union_LCA(u, v);
        set_Ef_path(u, r);
        set_Ef_path(v, r);
    }
    
}

// 读取文件
void readGraphFromFile(const string& filename, Graph& g) 
{
    union_reset(union_connect);
    ifstream File;
    File.open(filename);
    int count = 0;
    if (!File) 
    {
        cout << "File open failed!" << endl;
        exit(1);
    }
    if (File)
    {
        string line;
        getline(File, line);
        getline(File, line);
        while (getline(File, line))
        {
            count++;
            if(count%10000==0)
            {
                cout<<count<<endl;
            }
            int len = line.length();

            int u = 0;
            int v = 0;
            int flag = 0;
            int f = 0;
            for (int i = 0; i < len; i++)
            {
                if (line[i] == ' ')
                {
                    if (f)
                    {
                        flag++;
                        continue;
                    }
                    f++;
                }
                if (line[i] >= '0' && line[i] <= '9')
                {
                    if (flag)
                    {
                        v *= 10;
                        v += (line[i] - '0');
                    }
                    else
                    {
                        u *= 10;
                        u += (line[i] - '0');
                    }
                    f++;
                }

            }
            g.addEdge(u, v);
            //union_merge(union_connect,u, v);
        }
    }
    return;
}

// 时间
double get_current_time2() 
{
    auto now = std::chrono::high_resolution_clock::now();
    return std::chrono::duration<double>(now.time_since_epoch()).count();
}



int main()
{
    string fname[3];
    fname[0] = "smallG.txt";
    fname[1] = "mediumDG.txt";
    fname[2] = "largeG.txt";

    int n = 2;
    //cin >> n;

    if (n == 0)
    {
        N = 16;
        E = 20;
    }
    else if (n == 1)
    {
        N = 50;
        E = 150;
    }
    else
    {
        N = 1000000;
        E = 7590000;
    }

    Graph g(N);
    Graph gT(N);
    union_connect = new int[N];
    union_root = new int[N];
    edge = new int[N];
    Eflag = new int[N];
    deepth = new int[N];
    nte_1 = new int[E];
    nte_2 = new int[E];

    readGraphFromFile(fname[n], g);
    edge_reset();
    Eflag_reset();
    

    double t0, t1, t2, t3;

    // 使用蛮力法查找桥
    t0 = get_current_time2();
    /*auto bridges = g.findBridgesBruteForce();
    cout << "Bridges found by brute-force method:\n";
    for (auto& bridge : bridges)
    {
        cout << bridge.first << " - " << bridge.second << endl;
    }
    t1 = get_current_time2();
    cout << "total: " << bridges.size() << endl;
    cout << "time: " << t1 - t0;*/

    //g.tree_bfs();
    g.tree_union(gT);
    cout<<"1"<<endl;
    t1 = get_current_time2();
    //set_deepth();
    gT.tree_bfs();
    TREE_NUM/=2;
    cout<<"2"<<endl;
    t2 = get_current_time2();
    set_Ef();
    cout<<"3"<<endl;
    t3 = get_current_time2();

    cout << "total: " << TREE_NUM - CIRCLE_NUM << endl;
    cout << "time: " << t1 - t0 << endl<<t2-t1<<endl<<t3-t2<<endl;
    

    return 0;
}