import os
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import Select, WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

class BaseDepartment:
    def __init__(self, driver, visible_text, save_dir):
        self.driver = driver
        self.visible_text = visible_text
        self.save_dir = save_dir
        os.makedirs(save_dir, exist_ok=True)

    def scrape(self, target_count=100):
        print(f"\n📌 正在抓取 {self.visible_text} 新闻...")

        self.driver.get("https://www1.szu.edu.cn/board/infolist.asp")
        WebDriverWait(self.driver, 15).until(EC.presence_of_element_located((By.NAME, "dayy")))

        # 选择 2024 年和单位
        Select(self.driver.find_element(By.NAME, "dayy")).select_by_value("2024")
        Select(self.driver.find_element(By.NAME, "from_username")).select_by_visible_text(self.visible_text)
        self.driver.find_element(By.NAME, "searchb1").click()

        count = 0
        visited = set()

        while count < target_count:
            try:
                WebDriverWait(self.driver, 20).until(
                    EC.presence_of_all_elements_located((By.CSS_SELECTOR, "a[href*='view.asp?id=']"))
                )
            except:
                print(f"❌ 无新闻链接，保存调试页面：{self.visible_text}")
                with open(os.path.join(self.save_dir, "debug_page.html"), "w", encoding="utf-8") as f:
                    f.write(self.driver.page_source)
                return

            links = self.driver.find_elements(By.CSS_SELECTOR, "a[href*='view.asp?id=']")
            hrefs = [link.get_attribute("href") for link in links[2:]]  # 提前收集 href
            for url in hrefs:
                if url in visited:
                    continue
                visited.add(url)

                self.driver.execute_script("window.open(arguments[0]);", url)
                self.driver.switch_to.window(self.driver.window_handles[1])
                time.sleep(1)

                try:
                    WebDriverWait(self.driver, 15).until(EC.presence_of_element_located((By.TAG_NAME, "body")))
                    body = self.driver.find_element(By.TAG_NAME, "body").text.strip()

                    filename = f"{count+1:03d}.txt"
                    filepath = os.path.join(self.save_dir, filename)
                    with open(filepath, "w", encoding="utf-8") as f:
                        f.write(body)

                    print(f"✅ 已保存：{filename}")
                    count += 1
                except Exception as e:
                    print(f"⚠️ 处理失败：{e}")
                finally:
                    self.driver.close()
                    self.driver.switch_to.window(self.driver.window_handles[0])

                if count >= target_count:
                    break

            try:
                next_page = self.driver.find_element(By.LINK_TEXT, "下一页")
                next_page.click()
                time.sleep(2)
            except:
                print(f"🚫 {self.visible_text} 已无更多页面。")
                break

        print(f"🎉 {self.visible_text} 抓取完成，共 {count} 篇。")


class DepartmentA(BaseDepartment):
    def __init__(self, driver):
        super().__init__(driver, "26.国际交流与合作部", "./docs/A_国际交流与合作部")

class DepartmentB(BaseDepartment):
    def __init__(self, driver):
        super().__init__(driver, "9.教务部", "./docs/B_教务部")

class DepartmentC(BaseDepartment):
    def __init__(self, driver):
        super().__init__(driver, "27.人力资源部", "./docs/C_人力资源部")

class DepartmentD(BaseDepartment):
    def __init__(self, driver):
        super().__init__(driver, "69.图书馆", "./docs/D_图书馆")

class DepartmentE(BaseDepartment):
    def __init__(self, driver):
        super().__init__(driver, "79.校医院", "./docs/E_校医院")


if __name__ == "__main__":
    options = webdriver.ChromeOptions()
    # options.add_argument("--headless")  # 可取消注释启用无头浏览
    driver = webdriver.Chrome(options=options)

    print("🔐 请登录校园网，并确保浏览器跳转到：https://www1.szu.edu.cn/board/infolist.asp")
    driver.get("https://www1.szu.edu.cn/board/infolist.asp")
    input("✅ 登录成功后，按下回车开始抓取：")

    for dept_cls in [DepartmentA, DepartmentB, DepartmentC, DepartmentD, DepartmentE]:
        dept = dept_cls(driver)
        dept.scrape(100)

    driver.quit()
    print("\n✅ 全部部门处理完成，新闻已保存为纯文本。")
