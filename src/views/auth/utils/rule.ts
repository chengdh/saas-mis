import { reactive } from "vue";
import type { FormRules } from "element-plus";

/** 密码正则（密码格式应为8-18位数字、字母、符号的任意两种组合） */
export const REGEXP_PWD =
  /^(?![0-9]+$)(?![a-z]+$)(?![A-Z]+$)(?!([^(0-9a-zA-Z)]|[()])+$)(?!^.*[\u4E00-\u9FA5].*$)([^(0-9a-zA-Z)]|[()]|[a-z]|[A-Z]|[0-9]){8,18}$/;

/** 邮箱正则 */
export const REGEXP_EMAIL =
  /^[a-zA-Z0-9_-]+@[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)+$/;

/** 注册校验 */
export const registerRules = reactive<FormRules>({
  email: [
    {
      required: true,
      message: "请输入邮箱",
      trigger: "blur"
    },
    {
      type: "email",
      message: "请输入有效的邮箱地址",
      trigger: "blur"
    }
  ],
  tenantName: [
    {
      required: true,
      message: "请输入企业名称",
      trigger: "blur"
    },
    {
      min: 2,
      max: 50,
      message: "企业名称长度应在2-50个字符之间",
      trigger: "blur"
    }
  ],
  password: [
    {
      required: true,
      message: "请输入密码",
      trigger: "blur"
    },
    {
      validator: (rule, value, callback) => {
        if (value === "") {
          callback(new Error("请输入密码"));
        } else if (!REGEXP_PWD.test(value)) {
          callback(
            new Error("密码格式应为8-18位数字、字母、符号的任意两种组合")
          );
        } else {
          callback();
        }
      },
      trigger: "blur"
    }
  ],
  confirmPassword: [
    {
      required: true,
      message: "请确认密码",
      trigger: "blur"
    },
    {
      validator: (rule, value, callback) => {
        // Element Plus 会将整个表单模型作为 callback 的第四个参数
        // 但在某些情况下，这个参数可能不可靠
        // 获取表单实例并直接从表单模型中获取 password 值
        const formModel = (rule as any)?.formInstance?.model;

        if (value === "") {
          callback(new Error("请再次输入密码"));
        } else if (formModel && value !== formModel.password) {
          callback(new Error("两次输入的密码不一致"));
        } else {
          callback();
        }
      },
      trigger: "blur"
    }
  ],
  agreeTerms: [
    {
      validator: (rule, value, callback) => {
        if (!value) {
          callback(new Error("请阅读并同意用户协议和隐私政策"));
        } else {
          callback();
        }
      },
      trigger: "change"
    }
  ]
});
