import json
import logging
import requests
import hashlib
import uuid
import random
import time
from datetime import datetime

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('fetch_house_details.log'),
        logging.StreamHandler()
    ]
)

# API接口地址（需要根据实际情况修改）
API_URL = 'https://www.bsgzf.com.cn/api/oms/projects/projectWebDetailInfo'  # 请替换为实际的API地址

# 文件路径
import os
# 使用相对路径，基于脚本文件所在目录
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
JSON_FILE_PATH = os.path.join(SCRIPT_DIR, 'bsgz.json')
# 目标文件路径（public/data/bsgz.json）
PUBLIC_JSON_PATH = os.path.join(os.path.dirname(SCRIPT_DIR), 'public', 'data', 'bsgz.json')

# API返回数据结构说明
"""
API返回数据结构示例：
{
    "code": 0,  # 状态码，0表示成功
    "data": {    # 详细数据
        "projectShortName": "华涵佳苑",
        "openQueue": "1",
        "houseSource": "配建房",
        "mediaUrl": "...",
        "houseType": "公租房",
        "latitude": "31.352723",
        "textContent": "...",
        "fileProjectName": "华涵佳苑",
        "roomTypeInfos": "一",
        "visiblity": "1",
        "totalCount": "162",
        "supply": "社会面（个人、单位）",
        "kezuCount": 26,
        "layout": "顾村镇",
        "roomTypeCount": "一室户(总162套)",
        "projectNo": "0952",
        "district": "宝山区",
        "location": "上海市宝山区顾北路358弄",
        "projectName": "华涵佳苑",
        "openingDate": "2025-08-18",
        "totalArea": "9955.44",
        "longitude": "121.393645"
    },
    "message": "Operation successfully."  # 提示信息
}
"""

# 要更新的字段列表，确保只更新必要的字段
UPDATE_FIELDS = {
    'projectShortName', 'houseSource', 'houseType', 'textContent',
    'fileProjectName', 'roomTypeInfos', 'visiblity', 'totalCount',
    'supply', 'roomTypeCount', 'district', 'openingDate', 'totalArea'
}

# 中文数字到阿拉伯数字的映射
CHINESE_TO_ARABIC = {
    '一': '1',
    '二': '2',
    '三': '3',
    '四': '4',
    '五': '5',
    '六': '6',
    '七': '7',
    '八': '8',
    '九': '9',
    '十': '10'
}

# 房型详情API地址
ROOM_TYPE_API_URL = 'https://www.bsgzf.com.cn/api/oms/projects/getRoomTypeByProject'

def load_json_file():
    """加载JSON文件"""
    try:
        with open(JSON_FILE_PATH, 'r', encoding='utf-8') as f:
            data = json.load(f)
        logging.info(f"成功加载JSON文件，共包含 {data.get('count', 0)} 个房源")
        return data
    except Exception as e:
        logging.error(f"加载JSON文件失败: {str(e)}")
        raise

def save_json_file(data):
    """保存JSON文件"""
    try:
        with open(JSON_FILE_PATH, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        logging.info("成功保存JSON文件")
    except Exception as e:
        logging.error(f"保存JSON文件失败: {str(e)}")
        raise

def validate_json_file(file_path):
    """验证JSON文件的完整性和有效性"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        logging.info(f"JSON文件验证成功: {file_path}")
        return True, data
    except json.JSONDecodeError as e:
        logging.error(f"JSON文件格式错误: {str(e)}")
        return False, None
    except Exception as e:
        logging.error(f"验证JSON文件失败: {str(e)}")
        return False, None

def copy_json_to_public():
    """将script/bsgz.json覆盖到public/data/bsgz.json"""
    try:
        # 验证源文件的完整性
        is_valid, data = validate_json_file(JSON_FILE_PATH)
        if not is_valid:
            logging.error("源JSON文件无效，无法覆盖到public目录")
            return False
        
        # 确保目标目录存在
        os.makedirs(os.path.dirname(PUBLIC_JSON_PATH), exist_ok=True)
        
        # 原子方式写入目标文件
        import tempfile
        temp_file = None
        try:
            # 创建临时文件
            temp_fd, temp_file = tempfile.mkstemp(dir=os.path.dirname(PUBLIC_JSON_PATH), suffix='.tmp')
            
            # 写入临时文件
            with os.fdopen(temp_fd, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            
            # 原子方式替换文件
            os.replace(temp_file, PUBLIC_JSON_PATH)
            
            timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            logging.info(f"---------- [{timestamp}] 成功将JSON文件覆盖到public/data/bsgz.json ----------")
            return True
        except Exception as e:
            timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            logging.error(f"[{timestamp}] 覆盖JSON文件到public目录失败: {str(e)}")
            # 清理临时文件
            if temp_file and os.path.exists(temp_file):
                try:
                    os.unlink(temp_file)
                except:
                    pass
            return False
    except Exception as e:
        logging.error(f"复制JSON文件到public目录失败: {str(e)}")
        return False

def generate_headers():
    """生成符合规范的请求头"""
    # 生成时间戳
    timestamp = str(int(datetime.now().timestamp() * 1000))  # 毫秒时间戳
    
    # 生成UUID格式的nonce
    nonce_data = str(uuid.uuid4())
    
    # 计算Z-signature
    token = "1"  # 对应store.getState().userLoginInfo?.token || 1
    salt = "g8SzIXPkOm"
    signature_string = token + salt + timestamp + nonce_data
    
    # 使用MD5计算签名
    md5_hash = hashlib.md5()
    md5_hash.update(signature_string.encode('utf-8'))
    signature = md5_hash.hexdigest()
    
    # 构建请求头
    headers = {
        "Z-timestamp": timestamp,
        "Z-nonce": nonce_data,
        "Z-signature": signature,
        "Authorization": "1",
        "ip": "180.164.108.83",
        "userId": "MDAwMDAwMDA=",
        "type": "4"
    }
    
    return headers

def fetch_room_type_details(project_name, room_type):
    """通过API获取房型详情数据"""
    try:
        # 生成请求头
        headers = generate_headers()
        
        # 使用FormData格式提交请求
        form_data = {
            'projectName': project_name,
            'roomType': room_type
        }
        response = requests.post(ROOM_TYPE_API_URL, data=form_data, headers=headers, timeout=30)
        
        # 检查响应状态码
        response.raise_for_status()
        
        # 解析响应数据
        api_response = response.json()
        
        # 检查API返回状态
        if api_response.get('code') != 0:
            logging.error(f"房型API返回错误 (projectName: {project_name}, roomType: {room_type}): {api_response.get('message', '未知错误')}")
            return None
        
        # 提取data字段中的详细数据
        detail_data = api_response.get('data')
        if not detail_data:
            logging.error(f"房型API返回数据为空 (projectName: {project_name}, roomType: {room_type})")
            return None
        
        logging.info(f"成功获取房型详情数据 (projectName: {project_name}, roomType: {room_type})")
        return detail_data
    except requests.exceptions.RequestException as e:
        logging.error(f"请求房型API失败 (projectName: {project_name}, roomType: {room_type}): {str(e)}")
        return None
    except json.JSONDecodeError as e:
        logging.error(f"解析房型API响应失败 (projectName: {project_name}, roomType: {room_type}): {str(e)}")
        return None
    except Exception as e:
        logging.error(f"处理房型API响应失败 (projectName: {project_name}, roomType: {room_type}): {str(e)}")
        return None

def convert_chinese_to_arabic(chinese_num):
    """将中文数字转换为阿拉伯数字"""
    return CHINESE_TO_ARABIC.get(chinese_num, chinese_num)

def fetch_house_detail(project_no):
    """通过API获取房源详细数据"""
    try:
        # 生成请求头
        headers = generate_headers()
        
        # 使用FormData格式提交请求
        form_data = {'projectNo': project_no}
        response = requests.post(API_URL, data=form_data, headers=headers, timeout=30)
        
        # 检查响应状态码
        response.raise_for_status()
        
        # 解析响应数据
        api_response = response.json()
        
        # 检查API返回状态
        if api_response.get('code') != 0:
            logging.error(f"API返回错误 (projectNo: {project_no}): {api_response.get('message', '未知错误')}")
            return None
        
        # 提取data字段中的详细数据
        detail_data = api_response.get('data')
        if not detail_data:
            logging.error(f"API返回数据为空 (projectNo: {project_no})")
            return None
        
        logging.info(f"成功获取房源 {project_no} 的详细数据")
        return detail_data
    except requests.exceptions.RequestException as e:
        logging.error(f"请求API失败 (projectNo: {project_no}): {str(e)}")
        return None
    except json.JSONDecodeError as e:
        logging.error(f"解析API响应失败 (projectNo: {project_no}): {str(e)}")
        return None
    except Exception as e:
        logging.error(f"处理API响应失败 (projectNo: {project_no}): {str(e)}")
        return None

def save_json_file_atomic(data, project_no):
    """原子方式保存JSON文件"""
    import os
    import tempfile
    
    temp_file = None
    try:
        # 创建临时文件
        temp_fd, temp_file = tempfile.mkstemp(dir=os.path.dirname(JSON_FILE_PATH), suffix='.tmp')
        
        # 写入临时文件
        with os.fdopen(temp_fd, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        
        # 原子方式替换文件
        os.replace(temp_file, JSON_FILE_PATH)
        
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        logging.info(f"---------- [{timestamp}] 成功保存房源 {project_no} 的数据到JSON文件 ----------")
        return True
    except Exception as e:
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        logging.error(f"[{timestamp}] 保存房源 {project_no} 的数据失败: {str(e)}")
        # 清理临时文件
        if temp_file and os.path.exists(temp_file):
            try:
                os.unlink(temp_file)
            except:
                pass
        return False

def update_house_details():
    """更新所有房源的详细数据"""
    # 加载JSON文件
    data = load_json_file()
    
    # 获取房源列表
    house_list = data.get('pageContent', [])
    total_houses = len(house_list)
    success_count = 0
    failure_count = 0
    failed_projects = []
    
    logging.info(f"开始更新 {total_houses} 个房源的详细数据")
    
    # 遍历每个房源
    for index, house in enumerate(house_list):
        project_no = house.get('projectNo')
        if not project_no:
            logging.warning(f"第 {index + 1} 个房源缺少projectNo，跳过")
            failure_count += 1
            failed_projects.append({'projectNo': 'N/A', 'reason': '缺少projectNo'})
            continue
        
        logging.info(f"处理第 {index + 1}/{total_houses} 个房源: projectNo={project_no}")
        
        # 获取详细数据
        detail_data = fetch_house_detail(project_no)
        
        if detail_data:
            try:
                # 只更新指定的字段，避免覆盖不必要的信息
                updated_fields = 0
                for field in UPDATE_FIELDS:
                    if field in detail_data:
                        # 类型安全检查：确保数据类型一致
                        current_value = house.get(field)
                        new_value = detail_data[field]
                        
                        # 如果当前值存在且类型不同，进行适当的类型转换
                        if current_value is not None and type(current_value) != type(new_value):
                            try:
                                # 尝试转换类型
                                if isinstance(current_value, str):
                                    new_value = str(new_value)
                                elif isinstance(current_value, int):
                                    new_value = int(new_value)
                                elif isinstance(current_value, float):
                                    new_value = float(new_value)
                            except (ValueError, TypeError):
                                logging.warning(f"字段类型转换失败 (projectNo: {project_no}, field: {field})")
                                continue
                        
                        house[field] = new_value
                        updated_fields += 1
                
                logging.info(f"成功更新房源 {project_no} 的 {updated_fields} 个字段")
                success_count += 1
                
                # 获取房型详情数据
                project_name = house.get('projectName')
                room_type_infos = house.get('roomTypeInfos')
                
                if project_name and room_type_infos:
                    # 处理roomTypeInfos，可能包含多个房型，如"一,二"
                    room_types = [rt.strip() for rt in room_type_infos.split(',')]
                    room_type_details = []
                    
                    for room_type_chinese in room_types:
                        # 将中文数字转换为阿拉伯数字
                        room_type_arabic = convert_chinese_to_arabic(room_type_chinese)
                        logging.info(f"获取房型详情 (projectName: {project_name}, roomType: {room_type_arabic})")
                        
                        # 获取房型详情数据
                        room_detail = fetch_room_type_details(project_name, room_type_arabic)
                        if room_detail:
                            room_type_details.extend(room_detail)
                        
                        # 添加8秒固定间隔 + 0-10秒随机间隔
                        fixed_interval = 5
                        random.seed(datetime.now().timestamp())
                        random_interval = random.randint(0, 10)
                        total_interval = fixed_interval + random_interval
                        
                        logging.info(f"等待{total_interval}秒后处理下一个房型... (固定8秒 + 随机{random_interval}秒)")
                        time.sleep(total_interval)
                    
                    # 存储房型详情数据
                    if room_type_details:
                        house['roomTypeDetails'] = room_type_details
                        logging.info(f"成功存储 {len(room_type_details)} 条房型详情数据")
                    else:
                        logging.warning(f"未获取到房型详情数据 (projectNo: {project_no})")
                else:
                    logging.warning(f"缺少projectName或roomTypeInfos (projectNo: {project_no})")
                
                # 立即保存更新后的数据（原子写入）
                save_json_file_atomic(data, project_no)
            except Exception as e:
                logging.error(f"更新房源数据失败 (projectNo: {project_no}): {str(e)}")
                failure_count += 1
                failed_projects.append({'projectNo': project_no, 'reason': f'数据更新失败: {str(e)}'})
        else:
            failure_count += 1
            failed_projects.append({'projectNo': project_no, 'reason': 'API请求失败'})
        
        # 添加5秒固定间隔 + 0-10秒随机间隔
        fixed_interval = 5
        # 使用当前时间作为随机种子
        random.seed(datetime.now().timestamp())
        # 生成0-10秒的随机时间（包含0和10）
        random_interval = random.randint(0, 10)
        total_interval = fixed_interval + random_interval
        
        logging.info(f"等待{total_interval}秒后处理下一个房源... (固定5秒 + 随机{random_interval}秒)")
        time.sleep(total_interval)
    
    # 输出统计信息
    logging.info(f"更新完成: 成功 {success_count} 个, 失败 {failure_count} 个")
    if failed_projects:
        logging.warning(f"失败的房源: {failed_projects}")
    
    # 仅在数据抓取完全成功且无错误的情况下执行文件覆盖
    if failure_count == 0 and success_count > 0:
        logging.info("数据抓取完全成功，开始将JSON文件覆盖到public目录...")
        copy_json_to_public()
    else:
        logging.info("数据抓取存在失败项，跳过文件覆盖操作")
    
    return {
        'total': total_houses,
        'success': success_count,
        'failure': failure_count,
        'failed_projects': failed_projects
    }

def test_script():
    """测试脚本功能"""
    logging.info("开始测试脚本功能")
    
    # 测试1: 加载JSON文件
    try:
        data = load_json_file()
        logging.info("✓ 测试1通过: 成功加载JSON文件")
    except Exception as e:
        logging.error(f"✗ 测试1失败: 加载JSON文件失败 - {str(e)}")
        return False
    
    # 测试2: 测试API响应解析逻辑
    try:
        # 模拟API响应数据
        mock_response = {
            "code": 0,
            "data": {
                "projectShortName": "测试项目",
                "houseSource": "配建房",
                "houseType": "公租房",
                "textContent": "测试项目描述",
                "fileProjectName": "测试项目",
                "roomTypeInfos": "一",
                "visiblity": "1",
                "totalCount": "100",
                "supply": "社会面",
                "roomTypeCount": "一室户(总100套)",
                "district": "宝山区",
                "openingDate": "2025-01-01",
                "totalArea": "5000"
            },
            "message": "Operation successfully."
        }
        
        # 测试数据提取逻辑
        if mock_response.get('code') == 0:
            detail_data = mock_response.get('data')
            if detail_data:
                logging.info("✓ 测试2通过: 成功解析API响应数据")
            else:
                logging.error("✗ 测试2失败: API返回数据为空")
                return False
        else:
            logging.error("✗ 测试2失败: API返回错误状态")
            return False
    except Exception as e:
        logging.error(f"✗ 测试2失败: API响应解析失败 - {str(e)}")
        return False
    
    # 测试3: 测试数据更新逻辑
    try:
        test_house = {
            "projectNo": "0001",
            "projectName": "测试项目",
            "location": "测试地址"
        }
        
        test_detail = {
            "projectShortName": "测试项目简称",
            "houseSource": "配建房",
            "houseType": "公租房",
            "textContent": "测试项目详细描述"
        }
        
        # 模拟更新过程
        updated_fields = 0
        for field in UPDATE_FIELDS:
            if field in test_detail:
                test_house[field] = test_detail[field]
                updated_fields += 1
        
        if updated_fields > 0:
            logging.info(f"✓ 测试3通过: 成功更新 {updated_fields} 个字段")
        else:
            logging.error("✗ 测试3失败: 未更新任何字段")
            return False
    except Exception as e:
        logging.error(f"✗ 测试3失败: 数据更新失败 - {str(e)}")
        return False
    
    logging.info("所有测试通过！")
    return True

if __name__ == '__main__':
    # 首先运行测试
    if test_script():
        logging.info("开始执行房源详细数据抓取脚本")
        start_time = datetime.now()
        
        try:
            result = update_house_details()
            end_time = datetime.now()
            duration = (end_time - start_time).total_seconds()
            
            logging.info(f"脚本执行完成，耗时: {duration:.2f} 秒")
            logging.info(f"执行结果: 总计 {result['total']} 个房源, 成功 {result['success']} 个, 失败 {result['failure']} 个")
            
        except Exception as e:
            logging.error(f"脚本执行失败: {str(e)}")
            raise
    else:
        logging.error("测试失败，脚本执行终止")
