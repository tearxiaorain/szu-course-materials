#include <iostream>
#include <vector>
#include <queue>
#include <climits>
#include <chrono>
#include <map>
#include <string>
#include <algorithm>
#include<sstream>

using namespace std;

class Dinic {
    int n;
    vector<vector<int>> graph;
    vector<int> level, ptr;

public:
    Dinic(int size) : n(size), graph(size, vector<int>(size, 0)),
        level(size, -1), ptr(size, 0) {}

    void addEdge(int u, int v, int w) {
        graph[u][v] += w;  // 累加重边容量
    }

    bool bfs(int s, int t) {
        fill(level.begin(), level.end(), -1);
        level[s] = 0;
        queue<int> q;
        q.push(s);

        while (!q.empty()) {
            int u = q.front();
            q.pop();

            for (int v = 0; v < n; ++v) {
                if (level[v] == -1 && graph[u][v] > 0) {
                    level[v] = level[u] + 1;
                    q.push(v);
                }
            }
        }
        return level[t] != -1;
    }

    int dfs(int u, int t, int flow) {
        if (u == t || flow == 0)
            return flow;

        for (int& v = ptr[u]; v < n; ++v) {
            if (level[v] == level[u] + 1 && graph[u][v] > 0) {
                int pushed = dfs(v, t, min(flow, graph[u][v]));
                if (pushed > 0) {
                    graph[u][v] -= pushed;
                    graph[v][u] += pushed;
                    return pushed;
                }
            }
        }
        return 0;
    }

    int computeMaxFlow(int s, int t) {
        int maxFlow = 0;

        while (bfs(s, t)) {
            fill(ptr.begin(), ptr.end(), 0);
            while (int pushed = dfs(s, t, INT_MAX)) {
                maxFlow += pushed;
            }
        }
        return maxFlow;
    }
};

// 辅助结构体：存储球队信息
struct TeamInfo {
    string name;
    int wins;    // 已胜场数
    int toPlay;  // 剩余比赛场数
    map<string, int> against; // 对阵其他队伍剩余比赛场数
};

// 构建流网络并计算最大流
int buildAndComputeFlow(const map<string, TeamInfo>& allTeams, const string& teamToCheck, int& totalPossibleFlow) {
    vector<string> otherTeams;
    for (auto it = allTeams.begin(); it != allTeams.end(); ++it) {
        if (it->first != teamToCheck) {
            otherTeams.push_back(it->first);
        }
    }
    int k = otherTeams.size();
    if (k < 2) {
        totalPossibleFlow = 0;
        return 0; // 剩余队伍不足2支，无比赛点
    }

    // 计算节点数量：源点(1) + 比赛点(C(k,2)) + 队伍点(k) + 汇点(1)
    int numMatchNodes = k * (k - 1) / 2;
    int totalNodes = 1 + numMatchNodes + k + 1;
    int source = 0;
    int sink = totalNodes - 1;

    Dinic dk(totalNodes);

    // 映射：比赛点名称 -> 节点编号，队伍名称 -> 节点编号
    map<string, int> matchNodeMap;
    map<string, int> teamNodeMap;
    int nodeIdx = 1; // 源点是0，接下来分配比赛点
    for (int i = 0; i < k; ++i) {
        for (int j = i + 1; j < k; ++j) {
            string matchName = otherTeams[i] + "-" + otherTeams[j];
            matchNodeMap[matchName] = nodeIdx++;
        }
    }
    for (int i = 0; i < otherTeams.size(); ++i) {
        teamNodeMap[otherTeams[i]] = nodeIdx++;
    }

    // 1. 源点 -> 比赛点：容量为两队剩余比赛场数
    totalPossibleFlow = 0;
    for (int i = 0; i < k; ++i) {
        for (int j = i + 1; j < k; ++j) {
            string t1 = otherTeams[i];
            string t2 = otherTeams[j];
            string matchName = t1 + "-" + t2;
            int capacity = allTeams.at(t1).against.at(t2);
            dk.addEdge(source, matchNodeMap[matchName], capacity);
            totalPossibleFlow += capacity;
        }
    }

    // 2. 比赛点 -> 队伍点：容量设为大值（模拟无穷大）
    for (auto matchIt = matchNodeMap.begin(); matchIt != matchNodeMap.end(); ++matchIt) {
        const string& matchName = matchIt->first;
        int matchNode = matchIt->second;
        size_t pos = matchName.find('-');
        string t1 = matchName.substr(0, pos);
        string t2 = matchName.substr(pos + 1);
        dk.addEdge(matchNode, teamNodeMap[t1], 10000);
        dk.addEdge(matchNode, teamNodeMap[t2], 10000);
    }

    // 3. 队伍点 -> 汇点：容量为 w_max + r_x - w_i
    const TeamInfo& targetTeam = allTeams.at(teamToCheck);
    int w_max = targetTeam.wins + targetTeam.toPlay;

    for (auto teamIt = teamNodeMap.begin(); teamIt != teamNodeMap.end(); ++teamIt) {
        const string& team = teamIt->first;
        int teamNode = teamIt->second;
        const TeamInfo& info = allTeams.at(team);
        int capacity = w_max - info.wins;
        if (capacity < 0) capacity = 0; // 容量不能为负
        dk.addEdge(teamNode, sink, capacity);
    }

    // 计算最大流
    int maxFlow = dk.computeMaxFlow(source, sink);

    return maxFlow;
}

int main() {
   
    int n;
    cin >> n;
    cin.ignore(); // 忽略换行符

    vector<string> teamNames(n);
    map<string, TeamInfo> teams;

    // 读取每支队伍的数据
    for (int i = 0; i < n; ++i) {
        string line;
        getline(cin, line);
        stringstream ss(line);

        TeamInfo info;
        ss >> info.name;
        int wins, losses;
        ss >> wins >> losses >> info.toPlay;
        info.wins = wins;

        // 读取与其他队伍的剩余比赛场次
        for (int j = 0; j < n; ++j) {
            int games;
            ss >> games;
            if (j == i) continue; // 跳过与自己的比赛（总是0）
            // 暂时存储索引，稍后填充队伍名称
            info.against[to_string(j)] = games;
        }

        teamNames[i] = info.name;
        teams[info.name] = info;
    }

    // 更新队伍名称（替换索引为实际队伍名称）
    for (auto& teamPair : teams) {
        TeamInfo& info = teamPair.second;
        map<string, int> updatedAgainst;

        for (auto& againstPair : info.against) {
            int opponentIdx = stoi(againstPair.first);
            string opponentName = teamNames[opponentIdx];
            updatedAgainst[opponentName] = againstPair.second;
        }

        info.against = updatedAgainst;
    }

    // 设置运行次数（用于计算平均时间）
    int numRuns;
    cout << "请输入重复运行的次数：";
    cin >> numRuns;

    // 存储各队伍结果
    map<string, pair<bool, int>> results;

    double totalProcessingTime = 0;
    int teamCount = 0;

    // 对每支队伍进行判断
    for (auto it = teams.begin(); it != teams.end(); ++it) {
        teamCount++;
        const string& teamName = it->first;
        const TeamInfo& teamInfo = it->second;

        cout << "\n分析队伍 " << teamName << "：" << endl;

        // 简单判断：是否已确定淘汰
        bool simpleEliminated = false;
        for (auto otherIt = teams.begin(); otherIt != teams.end(); ++otherIt) {
            if (otherIt->first != teamName &&
                (teamInfo.wins + teamInfo.toPlay) < otherIt->second.wins) {
                simpleEliminated = true;
                cout << "【简单判断】已被 " << otherIt->first << " 淘汰（"
                    << teamInfo.wins + teamInfo.toPlay << " < " << otherIt->second.wins << "）" << endl;
                break;
            }
        }
        if (simpleEliminated) {
            results[teamName] = make_pair(true, teamInfo.wins + teamInfo.toPlay);
            continue;
        }

        // 多次运行计时
        auto startTotal = chrono::high_resolution_clock::now();
        int maxFlow = 0;
        int totalPossibleFlow = 0;

        for (int run = 0; run < numRuns; ++run) {
            int possibleFlow = 0;
            int flow = buildAndComputeFlow(teams, teamName, possibleFlow);

            if (run == 0) { // 只保存第一次的结果用于判断淘汰
                maxFlow = flow;
                totalPossibleFlow = possibleFlow;
            }
        }
        cout << "计算得到的最大流值为：" << maxFlow <<  endl;

        auto endTotal = chrono::high_resolution_clock::now();
        auto duration = chrono::duration_cast<chrono::nanoseconds>(endTotal - startTotal);
        double avgTime = duration.count() / (double)numRuns;
        totalProcessingTime += avgTime;


        // 判断是否淘汰
        bool isEliminated = (maxFlow != totalPossibleFlow);
        if (isEliminated) {
            cout << "【Dinic算法判断】已被淘汰（最大流 " << maxFlow
                << " < 总流量 " << totalPossibleFlow << "）" << endl;
        }
        else {
            cout << "【Dinic算法判断】未被淘汰（最大流 = 总流量 = " << maxFlow << "）" << endl;
        }

        results[teamName] = make_pair(isEliminated, teamInfo.wins + teamInfo.toPlay);
        cout << "平均计算时间: " << avgTime / 1000 << " μs" << endl;
    }

    // 输出最终结果
    cout << "\n\n==== 最终结果汇总 ====" << endl;
    for (auto resIt = results.begin(); resIt != results.end(); ++resIt) {
        const string& teamName = resIt->first;
        bool eliminated = resIt->second.first;
        int maxWins = resIt->second.second;

        if (eliminated) {
            cout << teamName << " 已被淘汰。最大可能胜场数: " << maxWins << endl;
        }
        else {
            cout << teamName << " 未被淘汰。最大可能胜场数: " << maxWins << endl;
        }
    }

    cout << "求出全部队伍结果的平均运行时间：" << totalProcessingTime / teamCount / 1000 << "μs" << endl;
    return 0;
}